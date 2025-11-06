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

// 模拟坐标系统，用于演示
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

// 为没有预定义坐标的地点生成默认坐标
const getDefaultCoordinates = (name: string): {latitude: number, longitude: number} => {
  // 使用景点名称生成相对固定的坐标，避免每次加载位置都不同
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // 生成北京附近的随机坐标，确保在地图可视范围内
  const baseLat = 39.9;
  const baseLng = 116.4;
  const latOffset = (hash % 100) / 1000;
  const lngOffset = ((hash >> 8) % 100) / 1000;
  
  return {
    latitude: baseLat + latOffset,
    longitude: baseLng + lngOffset
  };
};

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
  
  // 选中日期的景点数据
  const selectedDayAttractions = selectedDayData.filter(item => item.type === '景点');
  
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
        
        const backupKey = 'QlL4bs1xgXxz5EjBTK9uwBaUhxSnR3in'; // 备用密钥
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
      const apiKey = 'mK3ap8koipICbwUSJWxhFnvYeo0f9QlQ'; // 主密钥
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
        
        // 容器不存在时，尝试在短时间后重试
        setTimeout(() => {
          console.log('重试初始化地图...');
          initMap();
        }, 100);
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





  // 渲染地图标记
  const renderMapPoints = async () => {
    if (!map || !selectedDayAttractions || !window.BMap) {
      return;
    }
    
    try {
      // 清除之前的标记
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
      
      selectedDayAttractions.forEach((item, index) => {
        try {
          // 获取坐标，如果没有预定义则使用默认坐标
          const coordinates = mockCoordinates[item.name] || getDefaultCoordinates(item.name);
          const point = new window.BMap.Point(coordinates.longitude, coordinates.latitude);
          points.push(point);
          
          // 创建标记
          const marker = new window.BMap.Marker(point);
          
          // 自定义标记样式，添加序号
          const label = new window.BMap.Label(`${index + 1}`, {
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
          
          map.addOverlay(marker);
          markers.current.push(marker);
          
          // 添加信息窗口
          const description = `${index + 1}. ${item.name}\n时间: ${item.time || '未指定'}\n${item.description || '暂无描述'}`;
          const infoWindow = new window.BMap.InfoWindow(description);
          marker.addEventListener('click', () => {
            map.openInfoWindow(infoWindow, point);
          });
        } catch (e) {
          console.error(`添加标记失败 ${item.name}:`, e);
        }
      });
      
      // 设置地图视野，确保所有标记可见
      if (points.length > 0 && map) {
        map.setViewport(points, {
          margins: [50, 50, 50, 50]
        });
      } else if (points.length === 0 && itinerary) {
        // 如果没有景点，显示默认位置
        map.centerAndZoom(new window.BMap.Point(116.404, 39.915), 11);
      }
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
    if (itinerary && selectedDayAttractions) {
      if (!map && mapLoaded) {
        initMap();
      } else if (map) {
        renderMapPoints();
      }
    }
  }, [itinerary, selectedDay, selectedDayAttractions, map, mapLoaded]);

  // 页面挂载时加载地图并处理清理
  useEffect(() => {
    // 加载地图脚本
    loadBaiduMapScript();
    
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