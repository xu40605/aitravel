import React, { useEffect, useRef, useState } from 'react';
import { type Itinerary } from '../../api/planner';
import { Card, Empty, Select, Typography, List, Tag, Alert, Spin, Button } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';

// 声明BMap全局类型
declare global {
  interface Window {
    BMap: any;
    initMap: any;
  }
}

const { Text } = Typography;
const { Option } = Select;

// 坐标转换工具函数 - WGS84转BD-09
// WGS84 -> GCJ02
function wgs84ToGcj02(lng: number, lat: number): [number, number] {
  const pi = 3.1415926535897932384626;
  const a = 6378245.0;
  const ee = 0.00669342162296594323;

  const outOfChina = (lng: number, lat: number): boolean =>
    lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;

  if (outOfChina(lng, lat)) return [lng, lat];

  let dlat = transformLat(lng - 105.0, lat - 35.0);
  let dlng = transformLng(lng - 105.0, lat - 35.0);
  const radlat = lat / 180.0 * pi;
  let magic = Math.sin(radlat);
  magic = 1 - ee * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);
  dlng = (dlng * 180.0) / (a / sqrtMagic * Math.cos(radlat) * pi);
  const mglat = lat + dlat;
  const mglng = lng + dlng;
  return [mglng, mglat];
}

function transformLat(x: number, y: number): number {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0;
  ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0;
  return ret;
}

function transformLng(x: number, y: number): number {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0;
  ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0;
  return ret;
}

// GCJ02 -> BD09
function gcj02ToBd09(lng: number, lat: number): [number, number] {
  const xPi = Math.PI * 3000.0 / 180.0;
  const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * xPi);
  const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * xPi);
  const bdLng = z * Math.cos(theta) + 0.0065;
  const bdLat = z * Math.sin(theta) + 0.006;
  return [bdLng, bdLat];
}

// WGS84 -> BD09 - 主要转换函数
function wgs84ToBd09(lng: number, lat: number): [number, number] {
  const [gcjLng, gcjLat] = wgs84ToGcj02(lng, lat);
  return gcj02ToBd09(gcjLng, gcjLat);
}

// 模拟坐标系统，使用WGS84（GPS）坐标，将在渲染时自动转换为百度BD-09坐标
const mockCoordinates: Record<string, {latitude: number, longitude: number}> = {
  '北京故宫': { latitude: 39.916345, longitude: 116.397155 },
  '北京颐和园': { latitude: 39.999894, longitude: 116.275158 },
  '北京天坛': { latitude: 39.882315, longitude: 116.406791 },
  '北京八达岭长城': { latitude: 40.359889, longitude: 116.020029 },
  '上海外滩': { latitude: 31.240303, longitude: 121.490073 },
  '上海东方明珠': { latitude: 31.239635, longitude: 121.499708 },
  '上海迪士尼': { latitude: 31.143404, longitude: 121.657096 },
  '杭州西湖': { latitude: 30.259295, longitude: 120.146542 },
  '杭州灵隐寺': { latitude: 30.241757, longitude: 120.108228 },
  '成都大熊猫基地': { latitude: 30.732284, longitude: 104.154872 },
  '成都锦里': { latitude: 30.654927, longitude: 104.046376 },
  '西安兵马俑': { latitude: 34.386124, longitude: 109.273913 },
  '西安大雁塔': { latitude: 34.213225, longitude: 108.960388 }
};

// 注：已替换为基于城市的坐标生成函数 getCityBasedDefaultCoordinates

interface MapComponentProps {
  itinerary: Itinerary | null;
}

const MapComponent: React.FC<MapComponentProps> = ({ itinerary }) => {
  // 地图容器引用
  const mapRef = useRef<HTMLDivElement>(null);
  
  // 选中的日期
  const [selectedDay, setSelectedDay] = useState<number>(1);
  
  // 日期选项
  const dayOptions = itinerary?.days.map(day => day.day) || [];
  
  // 选中日期的数据
  const selectedDayData = itinerary?.days.find(day => day.day === selectedDay)?.activities || [];
  
  // 选中日期的数据，只显示景点类型
  const selectedDayAttractions = selectedDayData.filter(item => ['景点', '购物', '娱乐'].includes(item.type));
  
  // 标记列表引用
  const markers = useRef<Array<any>>([]);
  
  // 地图实例引用
  const [map, setMap] = useState<any>(null);
  
  // 地图加载状态
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  
  // 地图加载错误
  const [mapError, setMapError] = useState<string | null>(null);

  // 处理日期变化
  const handleDayChange = (day: number) => {
    setSelectedDay(day);
  };

  // 加载百度地图API
  const loadBaiduMapScript = () => {
    try {
      console.log('开始加载百度地图API...');
      
      // 检查是否已经加载
      if (window.BMap && typeof window.BMap.Map === 'function') {
        console.log('百度地图API已加载，直接初始化地图');
        setTimeout(() => {
          initMap();
        }, 100);
        return;
      }
      
      // 清理旧的地图脚本和BMap对象
      const oldScript = document.querySelector('script[src*="api.map.baidu.com"]');
      if (oldScript) {
        console.log('移除旧的百度地图脚本');
        oldScript.remove();
      }
      // 清理可能存在的不完整BMap对象
      if ((window as any).BMap && typeof (window as any).BMap.Map !== 'function') {
        console.log('清理不完整的BMap对象');
        delete (window as any).BMap;
      }
      
      // 加载备用密钥的函数
      const loadWithBackupKey = () => {
        console.log('尝试使用备用密钥加载百度地图API...');
        // 清理旧的脚本
        const oldScript = document.querySelector('script[src*="api.map.baidu.com"]');
        if (oldScript) {
          oldScript.remove();
        }
        
        const backupKey = import.meta.env.VITE_BAIDU_MAP_BACKUP_KEY || 'QlL4bs1xgXxz5EjBTK9uwBaUhxSnR3in'; // 从环境变量读取备用密钥
        const backupScript = document.createElement('script');
        backupScript.src = `https://api.map.baidu.com/api?v=3.0&ak=${backupKey}&s=1&callback=onBaiduMapLoaded`;
        backupScript.type = 'text/javascript';
        backupScript.async = true;
        backupScript.defer = true;
        
        backupScript.onerror = () => {
          console.error('备用密钥加载也失败了');
          setMapError('百度地图API加载失败，请检查网络连接或API密钥');
          setMapLoaded(false);
        };
        
        document.head.appendChild(backupScript);
      };
      
      // 设置全局回调函数
      (window as any).onBaiduMapLoaded = () => {
        console.log('百度地图API加载完成，回调函数被触发');
        // 检查BMap对象是否正确加载
        if (window.BMap && typeof window.BMap.Map === 'function') {
          console.log('BMap对象可用，开始初始化地图');
          setMapLoaded(true);
          setTimeout(() => {
            initMap();
          }, 100);
        } else {
          console.error('BMap对象未正确加载');
          setMapError('百度地图API加载失败');
          setMapLoaded(false);
          // 尝试使用备用密钥
          loadWithBackupKey();
        }
        // 清理回调函数
        delete (window as any).onBaiduMapLoaded;
      };
      
      // 创建新的脚本元素
      const script = document.createElement('script');
      // 使用新的API密钥格式，添加callback参数
      const apiKey = import.meta.env.VITE_BAIDU_MAP_KEY || 'mK3ap8koipICbwUSJWxhFnvYeo0f9QlQ'; // 从环境变量读取主密钥
      script.src = `https://api.map.baidu.com/api?v=3.0&ak=${apiKey}&s=1&callback=onBaiduMapLoaded`;
      script.type = 'text/javascript';
      script.async = true;
      script.defer = true;
      
      // 添加加载完成和错误处理
      script.onload = () => {
        console.log('百度地图脚本加载完成');
        // 设置超时检查，如果超过5秒BMap仍未加载，使用备用密钥
        setTimeout(() => {
          if (!window.BMap || typeof window.BMap.Map !== 'function') {
            console.log('BMap对象加载超时，尝试使用备用密钥');
            loadWithBackupKey();
          }
        }, 5000);
      };
      
      script.onerror = () => {
        console.error('百度地图脚本加载失败，尝试使用备用密钥');
        loadWithBackupKey();
      };
      
      // 添加脚本到文档头部
      console.log('添加百度地图脚本到文档');
      document.head.appendChild(script);
      
      // 设置超时处理，避免长时间等待
      setTimeout(() => {
        if (!window.BMap) {
          console.error('百度地图API加载超时，可能是密钥无效或网络问题');
          setMapError('百度地图API加载超时，请检查API密钥有效性');
          setMapLoaded(false);
          // 尝试使用备用密钥
          loadWithBackupKey();
        }
      }, 10000); // 10秒超时
      
    } catch (error) {
      console.error('加载百度地图API时出错:', error);
      setMapError('加载百度地图API时出错: ' + (error instanceof Error ? error.message : String(error)));
      setMapLoaded(false);
    }
  };

  // 初始化地图
  const initMap = () => {
    try {
      // 检查BMap对象是否已经加载
      if (!window.BMap || typeof window.BMap.Map !== 'function') {
        console.error('BMap对象未加载或不可用');
        setMapError('百度地图API未正确加载');
        // 尝试重新加载API
        setTimeout(() => {
          loadBaiduMapScript();
        }, 2000);
        return;
      }
      
      console.log('开始初始化地图...');
      
      // 尝试多种方式获取地图容器
      let container = mapRef.current;
      
      // 如果ref获取不到容器，尝试通过ID获取
      if (!container) {
        const elementById = document.getElementById('baidu-map-container');
        // 类型断言为HTMLDivElement
        if (elementById) {
          container = elementById as HTMLDivElement;
          console.log('尝试通过ID获取容器: 成功');
        } else {
          console.log('尝试通过ID获取容器: 失败');
        }
      }
      
      // 如果还是没有容器，等待并重试
  if (!container) {
    console.error('地图容器不存在，等待容器渲染完成...');
    
    // 容器不存在时，尝试在短时间后重试，但只有当有行程时才重试，避免无限重试
    if (itinerary) {
      setTimeout(() => {
        console.log('重试初始化地图...');
        initMap();
      }, 100);
    }
    return;
  }
      
      // 检查容器尺寸，确保有足够空间显示地图
      const containerStyle = window.getComputedStyle(container);
      const width = containerStyle.width;
      const height = containerStyle.height;
      console.log(`地图容器尺寸: ${width} x ${height}`);
      
      // 清理旧地图实例
      if (map) {
        try {
          console.log('清除旧的地图实例...');
          map.clearOverlays();
          markers.current = [];
        } catch (e) {
          console.error('清理旧地图实例失败:', e);
        }
      }
      
      console.log('创建新的地图实例...');
      // 创建地图实例
      try {
        const newMap = new window.BMap.Map(container);
        setMap(newMap);
        console.log('地图实例创建成功');

        // 设置地图中心点和缩放级别
        console.log('设置地图中心点和缩放级别...');
        const centerPoint = new window.BMap.Point(116.404, 39.915);
        newMap.centerAndZoom(centerPoint, 11);
        newMap.enableScrollWheelZoom(true);
        console.log('地图中心点和缩放级别设置完成');
        
        // 确保地图容器在视图中可见
        container.style.display = 'block';
        container.style.visibility = 'visible';
        
        // 设置地图加载完成状态
        setMapLoaded(true);
        setMapError(null);

        console.log('地图初始化成功');
        // 渲染地图标记
        renderMapPoints();
        
      } catch (mapCreateError) {
        console.error('创建地图实例失败:', mapCreateError);
        setMapError('创建地图实例失败: ' + (mapCreateError instanceof Error ? mapCreateError.message : String(mapCreateError)));
        setMapLoaded(false);
        // 尝试再次初始化
        setTimeout(() => {
          initMap();
        }, 500);
      }
      
    } catch (error) {
      console.error('初始化地图时出错:', error);
      setMapError('地图初始化失败: ' + (error instanceof Error ? error.message : String(error)));
      setMapLoaded(false);
    }
  };





  // 增强的地理编码功能，确保正确获取不同城市的景点坐标
  const getCoordinatesByGeocoding = (address: string): Promise<{latitude: number, longitude: number, isBd09?: boolean}> => {
    return new Promise((resolve) => {
      console.log(`开始获取地点坐标: ${address}`);
      
      // 先检查是否有预定义坐标
      if (mockCoordinates[address]) {
        console.log(`使用预定义坐标: ${address}`);
        // 预定义坐标是WGS84格式，需要转换
        resolve({...mockCoordinates[address], isBd09: false});
        return;
      }
      
      // 为每个景点名称生成特定的偏移量，避免多个景点重叠 - 使用基于米的微小偏移
      const getSpecificOffset = (name: string, baseLat = 30): {lat: number, lng: number} => {
        // 米转纬度: 1度纬度约等于111.32公里
        const metersToDegLat = (m: number) => m / 111320;
        // 米转经度: 根据纬度计算，经度在不同纬度处长度不同
        const metersToDegLng = (m: number, lat: number) => m / (111320 * Math.cos(lat * Math.PI / 180));
        
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const seed = Math.abs(hash);
        // 生成-40到40米范围内的偏移量
        const offsetMetersLat = ((seed % 81) - 40); // -40..40 m
        const offsetMetersLng = (((seed >> 8) % 81) - 40);
        
        return {
          lat: metersToDegLat(offsetMetersLat),
          lng: metersToDegLng(offsetMetersLng, baseLat)
        };
      };
      
      // 检查坐标是否在目标城市合理范围内（简化版，实际应用中可以使用更复杂的地理围栏判断）
      const isCoordinateInTargetCity = (lat: number, lng: number, targetCity: string): boolean => {
        // 获取目标城市的基准坐标
        const cityCoord = getCityBasedDefaultCoordinates('城市中心');
        // 计算与城市中心的距离（简化为度数差的平方和，适用于城市范围内的检查）
        const distanceSquared = Math.pow(lat - cityCoord.latitude, 2) + Math.pow(lng - cityCoord.longitude, 2);
        // 设置一个合理的阈值（大约覆盖城市市区范围）
        const threshold = 0.05; // 这个值需要根据实际情况调整
        const isInRange = distanceSquared < threshold;
        console.log(`坐标验证: ${lat},${lng} 是否在 ${targetCity} 范围内: ${isInRange}`);
        return isInRange;
      };
      
      // 使用百度地图地理编码服务
      if (window.BMap && typeof window.BMap.Geocoder === 'function') {
        console.log(`使用百度地图地理编码服务查询: ${address}`);
        const geocoder = new window.BMap.Geocoder();
        
        // 确保使用行程的目的地城市作为查询范围
        const city = itinerary?.destination || '北京';
        console.log(`当前行程目的地城市: ${city}`);
        
        // 设置超时处理
        const timeoutId = setTimeout(() => {
          console.log(`地理编码查询超时: ${address}，使用备用方案`);
          // 使用基于城市的默认坐标并添加特定偏移
          const defaultCoords = getCityBasedDefaultCoordinates(address);
          const offset = getSpecificOffset(address, defaultCoords.latitude);
          resolve({
            latitude: defaultCoords.latitude + offset.lat,
            longitude: defaultCoords.longitude + offset.lng,
            isBd09: false
          });
        }, 3000); // 3秒超时
        
        // 设置地理编码查询范围为当前行程城市
        if (city) {
          try {
            // 设置城市范围参数，提高查询准确性
            if (typeof geocoder.setLocation === 'function') {
              geocoder.setLocation(city);
              console.log(`已设置地理编码查询城市范围: ${city}`);
            } else {
              console.log('geocoder.setLocation 方法不可用');
            }
          } catch (e) {
            console.log('设置城市范围失败，继续使用默认方式查询:', e);
          }
        }
        
        // 构建查询策略：使用多种方式尝试获取坐标
        const queryStrategies = [
          // 策略1: 城市+地址（精确格式）
          () => {
            const fullAddress = city ? `${city}市${address}` : address; // 添加"市"以提高匹配精度
            console.log(`尝试策略1 - 完整地址: ${fullAddress}`);
            return new Promise<{latitude: number, longitude: number} | null>((resolve) => {
              geocoder.getPoint(fullAddress, (point: any) => {
                if (point) {
                  console.log(`策略1成功: ${fullAddress} -> ${point.lng}, ${point.lat}`);
                  // 验证坐标是否在目标城市范围内
                  if (isCoordinateInTargetCity(point.lat, point.lng, city)) {
                    resolve({ latitude: point.lat, longitude: point.lng });
                  } else {
                    console.log(`策略1返回的坐标不在目标城市范围内，尝试其他策略`);
                    resolve(null);
                  }
                } else {
                  resolve(null);
                }
              });
            });
          },
          
          // 策略2: 城市+地址（备选格式）
          () => {
            const fullAddress = city ? `${city}${address}` : address;
            console.log(`尝试策略2 - 城市+地址: ${fullAddress}`);
            return new Promise<{latitude: number, longitude: number} | null>((resolve) => {
              geocoder.getPoint(fullAddress, (point: any) => {
                if (point) {
                  console.log(`策略2成功: ${fullAddress} -> ${point.lng}, ${point.lat}`);
                  // 验证坐标是否在目标城市范围内
                  if (isCoordinateInTargetCity(point.lat, point.lng, city)) {
                    resolve({ latitude: point.lat, longitude: point.lng });
                  } else {
                    console.log(`策略2返回的坐标不在目标城市范围内，尝试其他策略`);
                    resolve(null);
                  }
                } else {
                  resolve(null);
                }
              });
            });
          },
          
          // 策略3: 城市+景点
          () => {
            const scenicSpotAddress = city ? `${city}${address}` : address;
            console.log(`尝试策略3 - 城市+景点: ${scenicSpotAddress}`);
            return new Promise<{latitude: number, longitude: number} | null>((resolve) => {
              geocoder.getPoint(scenicSpotAddress, (point: any) => {
                if (point) {
                  console.log(`策略3成功: ${scenicSpotAddress} -> ${point.lng}, ${point.lat}`);
                  // 验证坐标是否在目标城市范围内
                  if (isCoordinateInTargetCity(point.lat, point.lng, city)) {
                    resolve({ latitude: point.lat, longitude: point.lng });
                  } else {
                    console.log(`策略3返回的坐标不在目标城市范围内，尝试其他策略`);
                    resolve(null);
                  }
                } else {
                  resolve(null);
                }
              });
            });
          }
        ];
        
        // 依次尝试查询策略
        const tryNextStrategy = async (index: number) => {
          if (index >= queryStrategies.length) {
            // 所有策略都失败，尝试POI搜索
            console.log(`所有地理编码策略失败，尝试POI搜索: ${address}`);
            
            if (typeof window.BMap.LocalSearch === 'function') {
              try {
                const localSearch = new window.BMap.LocalSearch(city || '全国', {
                  onSearchComplete: (results: any) => {
                    clearTimeout(timeoutId);
                    if (results && results.getNumPois() > 0) {
                      const poi = results.getPoi(0);
                      const poiPoint = poi.point;
                      console.log(`POI搜索成功: ${address} -> ${poiPoint.lng}, ${poiPoint.lat}`);
                      // 验证坐标是否在目标城市范围内
                      if (isCoordinateInTargetCity(poiPoint.lat, poiPoint.lng, city)) {
                        resolve({ latitude: poiPoint.lat, longitude: poiPoint.lng, isBd09: true });
                      } else {
                        console.log(`POI搜索返回的坐标不在目标城市范围内，使用基于城市的默认坐标`);
                        const defaultCoords = getCityBasedDefaultCoordinates(address);
                        const offset = getSpecificOffset(address, defaultCoords.latitude);
                        resolve({
                          latitude: defaultCoords.latitude + offset.lat,
                          longitude: defaultCoords.longitude + offset.lng,
                          isBd09: false
                        });
                      }
                    } else {
                      console.log(`POI搜索也失败，使用基于城市的默认坐标`);
                      const defaultCoords = getCityBasedDefaultCoordinates(address);
                      const offset = getSpecificOffset(address, defaultCoords.latitude);
                      resolve({
                        latitude: defaultCoords.latitude + offset.lat,
                        longitude: defaultCoords.longitude + offset.lng,
                        isBd09: false  // 默认坐标是WGS84格式
                      });
                    }
                  }
                });
                
                // 设置搜索结果数量限制
                if (typeof localSearch.setSearchCompleteCallback === 'function') {
                  localSearch.setSearchCompleteCallback((results: any) => {
                    clearTimeout(timeoutId);
                    if (results && results.getNumPois() > 0) {
                      const poi = results.getPoi(0);
                      const poiPoint = poi.point;
                      console.log(`POI搜索成功: ${address} -> ${poiPoint.lng}, ${poiPoint.lat}`);
                      // 验证坐标是否在目标城市范围内
                      if (isCoordinateInTargetCity(poiPoint.lat, poiPoint.lng, city)) {
                        resolve({ latitude: poiPoint.lat, longitude: poiPoint.lng, isBd09: true });
                      } else {
                        console.log(`POI搜索返回的坐标不在目标城市范围内，使用基于城市的默认坐标`);
                        const defaultCoords = getCityBasedDefaultCoordinates(address);
                        const offset = getSpecificOffset(address, defaultCoords.latitude);
                        resolve({
                          latitude: defaultCoords.latitude + offset.lat,
                          longitude: defaultCoords.longitude + offset.lng,
                          isBd09: false
                        });
                      }
                    } else {
                      console.log(`POI搜索也失败，使用基于城市的默认坐标`);
                      const defaultCoords = getCityBasedDefaultCoordinates(address);
                      const offset = getSpecificOffset(address, defaultCoords.latitude);
                      resolve({
                        latitude: defaultCoords.latitude + offset.lat,
                        longitude: defaultCoords.longitude + offset.lng,
                        isBd09: false  // 默认坐标是WGS84格式
                      });
                    }
                  });
                }
                
                // 执行POI搜索
                localSearch.search(address);
              } catch (poiError) {
                clearTimeout(timeoutId);
                console.log(`POI搜索失败:`, poiError);
                const defaultCoords = getCityBasedDefaultCoordinates(address);
                const offset = getSpecificOffset(address, defaultCoords.latitude);
                resolve({
                  latitude: defaultCoords.latitude + offset.lat,
                  longitude: defaultCoords.longitude + offset.lng,
                  isBd09: false
                });
              }
            } else {
              clearTimeout(timeoutId);
              console.log(`POI搜索服务不可用，使用基于城市的默认坐标`);
              const defaultCoords = getCityBasedDefaultCoordinates(address);
              const offset = getSpecificOffset(address, defaultCoords.latitude);
              resolve({
                latitude: defaultCoords.latitude + offset.lat,
                longitude: defaultCoords.longitude + offset.lng,
                isBd09: false  // 默认坐标是WGS84格式
              });
            }
            return;
          }
          
          try {
            const result = await queryStrategies[index]();
            if (result) {
              clearTimeout(timeoutId);
              // 为结果添加微小偏移，避免多个标记重叠
              const offset = getSpecificOffset(address, result.latitude);
              resolve({
                latitude: result.latitude + offset.lat,
                longitude: result.longitude + offset.lng,
                isBd09: true  // 从百度地图API获取的坐标是BD-09格式
              });
            } else {
              tryNextStrategy(index + 1);
            }
          } catch (e) {
            console.error(`策略 ${index + 1} 执行失败:`, e);
            tryNextStrategy(index + 1);
          }
        };
        
        // 开始尝试第一个策略
        tryNextStrategy(0);
      } else {
        console.log('地理编码服务不可用，使用城市默认坐标');
        const defaultCoords = getCityBasedDefaultCoordinates(address);
        const offset = getSpecificOffset(address, defaultCoords.latitude);
        resolve({
          latitude: defaultCoords.latitude + offset.lat,
          longitude: defaultCoords.longitude + offset.lng,
          isBd09: false
        });
      }
    });
  };

  // 增强的基于城市生成默认坐标函数，使用WGS84坐标，将在渲染时自动转换为百度BD-09坐标
  const getCityBasedDefaultCoordinates = (name: string): {latitude: number, longitude: number} => {
    // 获取行程目的地城市
    const city = itinerary?.destination || '北京';
    console.log(`为地点 ${name} 生成 ${city} 区域的默认坐标`);
    
    // 扩展支持更多城市的基准坐标
    const cityBaseCoordinates: Record<string, {latitude: number, longitude: number}> = {
      '北京': { latitude: 39.9, longitude: 116.4 },
      '上海': { latitude: 31.23, longitude: 121.47 },
      '广州': { latitude: 23.13, longitude: 113.26 },
      '深圳': { latitude: 22.54, longitude: 114.06 },
      '杭州': { latitude: 30.27, longitude: 120.15 },
      '成都': { latitude: 30.57, longitude: 104.06 },
      '西安': { latitude: 34.34, longitude: 108.94 },
      '南京': { latitude: 32.06, longitude: 118.79 },
      '武汉': { latitude: 30.59, longitude: 114.31 },
      '重庆': { latitude: 29.56, longitude: 106.55 },
      // 添加更多城市支持
      '长沙': { latitude: 28.22, longitude: 112.94 },
      '青岛': { latitude: 36.07, longitude: 120.38 },
      '厦门': { latitude: 24.47, longitude: 118.08 },
      '三亚': { latitude: 18.25, longitude: 109.51 },
      '丽江': { latitude: 26.86, longitude: 100.25 },
      '大理': { latitude: 25.60, longitude: 100.24 },
      '拉萨': { latitude: 29.65, longitude: 91.11 },
      '乌鲁木齐': { latitude: 43.82, longitude: 87.61 },
      '哈尔滨': { latitude: 45.80, longitude: 126.53 },
      '大连': { latitude: 38.92, longitude: 121.63 }
    };
    
    // 使用城市基准坐标或尝试从行程中推断城市
    let baseCoord = cityBaseCoordinates[city];
    
    // 如果没有找到城市坐标，尝试智能推断
    if (!baseCoord && itinerary) {
      console.log(`未找到城市 ${city} 的基准坐标，尝试从行程描述推断`);
      
      // 从行程描述中查找可能的城市关键词
      const allActivities = itinerary.days.flatMap(day => day.activities);
      const allText = allActivities.map(a => `${a.name} ${a.description}`).join(' ');
      
      // 检查是否包含其他城市关键词
      for (const [cityName, coords] of Object.entries(cityBaseCoordinates)) {
        if (allText.includes(cityName) && cityName !== city) {
          console.log(`从行程描述中推断城市: ${cityName}`);
          baseCoord = coords;
          break;
        }
      }
    }
    
    // 如果仍然没有找到，使用北京作为默认值
    if (!baseCoord) {
      console.log(`无法确定城市，使用北京作为默认坐标`);
      baseCoord = cityBaseCoordinates['北京'];
    }
    
    // 使用景点名称生成相对固定的坐标偏移
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // 生成基于城市的坐标，确保在城市可视范围内，使用基于米的微小偏移量避免标记重叠
    // 米转纬度: 1度纬度约等于111.32公里
    const metersToDegLat = (m: number) => m / 111320;
    // 米转经度: 根据纬度计算，经度在不同纬度处长度不同
    const metersToDegLng = (m: number, lat: number) => m / (111320 * Math.cos(lat * Math.PI / 180));
    
    // 生成-30到30米范围内的微小偏移量
    const offsetMetersLat = ((hash % 61) - 30); // -30..30 m
    const offsetMetersLng = (((hash >> 8) % 61) - 30);
    
    const latOffset = metersToDegLat(offsetMetersLat);
    const lngOffset = metersToDegLng(offsetMetersLng, baseCoord.latitude);
    
    const result = {
      latitude: baseCoord.latitude + latOffset,
      longitude: baseCoord.longitude + lngOffset
    };
    
    console.log(`生成默认坐标: ${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`);
    return result;
  };

  // 渲染地图标记 - 增强版，使用前端手动WGS84到BD-09坐标转换算法，确保所有景点准确显示
  const renderMapPoints = async () => {
    if (!map || !selectedDayAttractions || !window.BMap) {
      console.log('地图标记渲染条件不满足:', { map: !!map, attractions: !!selectedDayAttractions, BMap: !!window.BMap });
      return;
    }
    
    console.log(`开始渲染地图标记，共有 ${selectedDayAttractions.length} 个景点`);
    
    try {
      // 清除之前的标记
      console.log('清除之前的地图标记');
      markers.current.forEach(marker => {
        try {
          map.removeOverlay(marker);
        } catch (e) {
          console.error('移除标记失败:', e);
        }
      });
      markers.current = [];
      
      // 添加标记
      const points: any[] = [];
      
      // 增强的坐标获取逻辑 - 为每个景点单独处理坐标获取，添加错误处理
      for (let i = 0; i < selectedDayAttractions.length; i++) {
        const item = selectedDayAttractions[i];
        try {
          console.log(`处理景点 ${i + 1}: ${item.name}`);
          
          // 获取坐标，添加重试逻辑
          let coordinates;
          let isBd09Coordinate = false; // 标记坐标是否已经是BD-09坐标系
          let retryCount = 0;
          const maxRetries = 2;
          
          while (retryCount <= maxRetries) {
            try {
              coordinates = await getCoordinatesByGeocoding(item.name);
              console.log(`成功获取坐标: ${item.name} -> ${coordinates.latitude}, ${coordinates.longitude}`);
              // 使用返回的isBd09标志来确定坐标系统
              isBd09Coordinate = coordinates.isBd09 || false;
              break;
            } catch (geoError) {
              retryCount++;
              console.warn(`获取坐标失败，正在重试 (${retryCount}/${maxRetries}):`, geoError);
              if (retryCount > maxRetries) {
                // 使用备用坐标 - 这些是WGS84坐标，需要转换
                coordinates = getCityBasedDefaultCoordinates(item.name);
                console.log(`使用备用坐标: ${item.name} -> ${coordinates.latitude}, ${coordinates.longitude}`);
                isBd09Coordinate = false;
              }
            }
          }
          
          // 确保坐标有效
          if (!coordinates) {
            console.warn(`无法获取景点 ${item.name} 的有效坐标`);
            continue;
          }
          
          let bdPoint;
          if (isBd09Coordinate) {
            // 已经是BD-09坐标，直接使用
            bdPoint = new window.BMap.Point(coordinates.longitude, coordinates.latitude);
            console.log(`直接使用BD-09坐标: ${bdPoint.lng}, ${bdPoint.lat}`);
          } else {
            // WGS84坐标需要转换为BD-09坐标
            const [bdLng, bdLat] = wgs84ToBd09(coordinates.longitude, coordinates.latitude);
            bdPoint = new window.BMap.Point(bdLng, bdLat);
            console.log(`WGS84转BD-09坐标: ${coordinates.longitude},${coordinates.latitude} -> ${bdLng},${bdLat}`);
          }
          points.push(bdPoint);
          
          // 创建标记
          const marker = new window.BMap.Marker(bdPoint);
          
          // 自定义标记样式，添加序号
          const label = new window.BMap.Label(`${i + 1}`, {
            offset: new window.BMap.Size(-10, -20)
          });
          label.setStyle({
            color: '#fff',
            backgroundColor: '#1890ff',
            border: 'none',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            lineHeight: '20px',
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: 'bold'
          });
          marker.setLabel(label);
          
          // 添加到地图
          map.addOverlay(marker);
          markers.current.push(marker);
          
          // 添加信息窗口
          const description = `${i + 1}. ${item.name}\n时间: ${item.time || '未指定'}\n${item.description || '暂无描述'}\n坐标: ${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)} (BD-09转换)`;
          const infoWindow = new window.BMap.InfoWindow(description);
          marker.addEventListener('click', () => {
            map.openInfoWindow(infoWindow, bdPoint);
          });
          
        } catch (e) {
          console.error(`添加标记失败 ${item.name}:`, e);
        }
      }
      
      // 增强的地图视野设置
      if (points.length > 0 && map) {
        console.log(`设置地图视野以显示 ${points.length} 个景点`);
        
        // 先尝试使用setViewport
        try {
          map.setViewport(points, {
            margins: [50, 50, 50, 50],
            maxZoom: 15,  // 设置最大缩放级别
            minZoom: 8    // 设置最小缩放级别
          });
        } catch (viewportError) {
          console.error('设置地图视野失败，使用备用方法:', viewportError);
          
          // 备用方法：计算中心点和适当的缩放级别
          if (points.length === 1) {
            // 单个点，设置适当的缩放级别
            map.centerAndZoom(points[0], 13);
          } else {
            // 多个点，计算中心点
            let totalLat = 0, totalLng = 0;
            points.forEach(p => {
              totalLat += p.lat;
              totalLng += p.lng;
            });
            const centerLat = totalLat / points.length;
            const centerLng = totalLng / points.length;
            const centerPoint = new window.BMap.Point(centerLng, centerLat);
            
            // 根据点的分布设置缩放级别
            let maxDist = 0;
            points.forEach(p => {
              const dist = map.getDistance(centerPoint, p);
              maxDist = Math.max(maxDist, dist);
            });
            
            // 根据最大距离计算合适的缩放级别
            let zoom = 10;
            if (maxDist < 1000) zoom = 15;
            else if (maxDist < 5000) zoom = 13;
            else if (maxDist < 10000) zoom = 12;
            else if (maxDist < 20000) zoom = 11;
            else if (maxDist < 50000) zoom = 10;
            else zoom = 8;
            
            map.centerAndZoom(centerPoint, zoom);
          }
        }
      } else if (points.length === 0 && itinerary) {
        // 如果没有景点，显示目的地城市的中心位置
        const city = itinerary.destination || '北京';
        console.log(`没有找到景点标记，显示城市中心: ${city}`);
        
        const cityBaseCoordinates: Record<string, {latitude: number, longitude: number}> = {
          '北京': { latitude: 39.9, longitude: 116.4 },
          '上海': { latitude: 31.23, longitude: 121.47 },
          '广州': { latitude: 23.13, longitude: 113.26 },
          '深圳': { latitude: 22.54, longitude: 114.06 },
          '杭州': { latitude: 30.27, longitude: 120.15 },
          '成都': { latitude: 30.57, longitude: 104.06 },
          '西安': { latitude: 34.34, longitude: 108.94 },
          '南京': { latitude: 32.06, longitude: 118.79 },
          '武汉': { latitude: 30.59, longitude: 114.31 },
          '重庆': { latitude: 29.56, longitude: 106.55 },
          '长沙': { latitude: 28.22, longitude: 112.94 },
          '青岛': { latitude: 36.07, longitude: 120.38 },
          '厦门': { latitude: 24.47, longitude: 118.08 },
          '三亚': { latitude: 18.25, longitude: 109.51 }
        };
        
        const defaultPoint = cityBaseCoordinates[city] || cityBaseCoordinates['北京'];
        map.centerAndZoom(new window.BMap.Point(defaultPoint.longitude, defaultPoint.latitude), 11);
      }
      
      console.log('地图标记渲染完成');
    } catch (error) {
      console.error('渲染地图标记失败:', error);
      setMapError('地图标记加载失败');
    }
  };

  // 不再需要全局initMap函数，移除它
  useEffect(() => {
    // 清理可能存在的全局initMap函数
    if (window.initMap && typeof window.initMap === 'function') {
      delete window.initMap;
    }
  }, []);

  // 监听行程变化
  useEffect(() => {
    console.log('行程或选择的日期发生变化');
    // 当行程变为null时，清理地图资源
    if (!itinerary) {
      try {
        // 清理标记和地图实例
        if (map) {
          map.clearOverlays();
          markers.current = [];
        }
        
        setMap(null);
        setMapLoaded(false);
        setMapError(null);
      } catch (e) {
        console.error('清理地图资源失败:', e);
      }
      return;
    }
    
    if (itinerary && selectedDayAttractions) {
      console.log(`当前行程: ${itinerary.destination}，选择的日期: ${selectedDay}，景点数量: ${selectedDayAttractions.length}`);
      
      // 添加延迟，确保地图容器完全渲染
      const timer = setTimeout(() => {
        if (!map && mapLoaded) {
          console.log('地图未初始化但已加载，开始初始化');
          initMap();
        } else if (map) {
          console.log('地图已初始化，开始渲染标记');
          renderMapPoints();
        } else if (!mapLoaded) {
          console.log('地图未加载完成，开始加载地图');
          loadBaiduMapScript();
        }
      }, 300);  // 300ms延迟确保DOM更新完成
      
      return () => clearTimeout(timer);
    }
  }, [itinerary, selectedDay, selectedDayAttractions, map, mapLoaded]);

  // 页面挂载时加载地图并处理清理
  useEffect(() => {
    // 只有当有行程时才加载地图脚本
    if (itinerary) {
      loadBaiduMapScript();
    }
    
    // 清理函数，移除地图实例和相关资源
    return () => {
      try {
        // 清理标记和地图实例
        if (map) {
          map.clearOverlays();
          markers.current = [];
        }
        
        // 移除可能存在的地图脚本
        const script = document.querySelector('script[src*="api.map.baidu.com"]');
        if (script) {
          script.remove();
        }
        
        // 清理全局BMap对象和状态
        if (window.BMap) {
          delete window.BMap;
        }
        
        setMap(null);
        setMapLoaded(false);
      } catch (e) {
        console.error('组件卸载时清理地图资源失败:', e);
      }
    };
  }, []);
  
  // 渲染模拟地图视图
  const renderMockMap = () => {
    return (
      <div style={{
        textAlign: 'center',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        width: '100%',
        maxWidth: '500px'
      }}>
        <EnvironmentOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
        <h3 style={{ marginBottom: '8px' }}>第{selectedDay}天行程</h3>
        
        {!mapLoaded && !mapError && (
          <div style={{ textAlign: 'center' }}>
            <Spin size="large" tip="地图加载中..." style={{ marginBottom: '20px' }} />
            <p style={{ color: '#666', marginBottom: '20px' }}>正在加载百度地图，请稍候...</p>
            <div style={{
              fontSize: '12px',
              color: '#999',
              padding: '10px',
              backgroundColor: '#f9f9f9',
              borderRadius: '4px',
              textAlign: 'left'
            }}>
              <p>正在执行的操作：</p>
              <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                <li>1. 加载百度地图API资源</li>
                <li>2. 初始化地图容器</li>
                <li>3. 设置地图中心点和缩放级别</li>
                <li>4. 渲染行程景点标记</li>
              </ul>
            </div>
          </div>
        )}
        
        {mapError && (
          <div>
            <Alert
              message="地图加载失败"
              description={mapError || '无法加载百度地图，请检查网络连接或稍后重试'}
              type="error"
              showIcon
              style={{ marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Button 
                type="primary" 
                onClick={() => {
                  setMapLoaded(false);
                  setMapError(null);
                  loadBaiduMapScript();
                }}
              >
                重试加载
              </Button>
              <Button 
                onClick={() => {
                  // 直接显示景点列表作为替代
                  setMapError('使用备用视图');
                }}
              >
                显示景点列表
              </Button>
            </div>
            <p style={{ marginTop: '15px', fontSize: '12px', color: '#999' }}>
              如果问题持续，请检查API密钥是否有效或尝试刷新页面
            </p>
          </div>
        )}
        
        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
          <h3 style={{ marginBottom: '15px', color: '#333', fontSize: '16px' }}>当前行程景点</h3>
          {selectedDayAttractions.length > 0 ? (
            <List
              size="small"
              dataSource={selectedDayAttractions}
              renderItem={(item, index) => (
                <List.Item 
                    style={{ 
                      padding: '10px 0', 
                      borderBottom: '1px solid #f5f5f5'
                    }}
                    actions={[<Tag color="blue">{item.time || '未指定'}</Tag>]}
                >
                  <List.Item.Meta
                    title={`${index + 1}. ${item.name}`}
                    description={item.description || '暂无描述'}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无景点安排" />
          )}
        </div>
      </div>
    );
  };

  return (
    <Card title="地图展示" className="shadow-lg h-full">
      {!itinerary ? (
        <div style={{ 
          height: '500px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Empty description="请先生成旅行计划" />
        </div>
      ) : (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '16px' }}>
            <Text>选择日期: </Text>
            <Select 
              value={selectedDay} 
              onChange={handleDayChange} 
              style={{ width: '120px' }} 
              allowClear={false}
              disabled={dayOptions.length === 0}
            >
              {dayOptions.map(day => (
                <Option key={day} value={day}>第{day}天</Option>
              ))}
            </Select>
            {mapError && (
              <Alert 
                message={mapError} 
                type="error" 
                showIcon 
                style={{ marginTop: '8px' }} 
                closable
                afterClose={() => setMapError(null)}
              />
            )}
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            {/* 始终渲染地图容器，确保地图初始化时有DOM元素 */}
            {/* 地图容器 - 确保有明确的尺寸和样式，以便地图能够正确渲染 */}
              <div 
                ref={mapRef} 
                id="baidu-map-container"
                style={{ 
                  width: '100%', 
                  height: '500px', 
                  borderRadius: '4px', 
                  border: '1px solid #e8e8e8',
                  position: 'relative',
                  overflow: 'hidden',
                  minWidth: '300px',
                  minHeight: '300px',
                  background: '#fafafa',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                {/* 地图加载中或错误时显示覆盖层 */}
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: (!mapLoaded || mapError) ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: (!mapLoaded || mapError) ? 1000 : 0,
                    padding: '20px',
                    boxSizing: 'border-box',
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  {(!mapLoaded || mapError) && renderMockMap()}
                </div>
              </div>
          </div>
          <div style={{ marginTop: '16px', maxHeight: '200px', overflowY: 'auto' }}>
            <Text strong>当天景点安排:</Text>
            {selectedDayAttractions.length > 0 ? (
              <List
                size="small"
                dataSource={selectedDayAttractions}
                renderItem={(item, index) => (
                  <List.Item 
                    actions={[
                      <Tag color="blue">{item.time || '未指定'}</Tag>
                    ]}
                  >
                    <List.Item.Meta
                      title={`${index + 1}. ${item.name}`}
                      description={item.description || '暂无描述'}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="当天暂无景点安排" style={{ marginTop: '16px' }} />
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default MapComponent;