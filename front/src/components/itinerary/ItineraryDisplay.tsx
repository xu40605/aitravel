import React from 'react';
import { Card, Typography, Alert, List, Tag, Tabs, Spin } from 'antd';
import { type Itinerary } from '../../api/planner';
import MapComponent from './MapComponent';

const { Title, Paragraph } = Typography;

interface ItineraryDisplayProps {
  itinerary: Itinerary;
  loading?: boolean;
}

const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ itinerary, loading = false }) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16 }}>正在加载旅行计划...</Paragraph>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Paragraph>暂无行程数据</Paragraph>
      </div>
    );
  }

  // 获取活动类型对应的标签颜色
  const getTypeColor = (type: string) => {
    const typeMap: { [key: string]: string } = {
      '交通': 'cyan',
      '餐厅': 'red',
      '住宿': 'green',
      '景点': 'orange',
      'attraction': 'green',
      'dining': 'orange',
      'accommodation': 'purple',
      'transportation': 'blue'
    };
    return typeMap[type] || 'purple';
  };
  
  // 转换英文类型名称为中文
  const getTypeName = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'attraction': '景点',
      'dining': '餐厅',
      'accommodation': '住宿',
      'transportation': '交通'
    };
    return typeMap[type] || type;
  };

  // 构建标签页数据
  const tabItems = [
    {
      key: 'overview',
      label: '总览',
      children: (
        <div className="itinerary-overview" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* 行程概览卡片 */}
          <Card size="small" className="mb-4">
            <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>{itinerary.destination} 旅行计划</Title>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <Paragraph style={{ margin: 0 }}>
                  <strong>目的地：</strong>{itinerary.destination}
                </Paragraph>
                <Paragraph style={{ margin: 0 }}>
                  <strong>日期：</strong>{itinerary.startDate} 至 {itinerary.endDate}
                </Paragraph>
              </div>
              <div>
                <Paragraph style={{ margin: 0 }}>
                  <strong>人数：</strong>{itinerary.travelers}人
                </Paragraph>
                <Paragraph style={{ margin: 0 }}>
                  <strong>预算：</strong>¥{itinerary.budget}
                  {itinerary.estimatedBudget && (
                    <span style={{ marginLeft: '8px', color: '#1890ff' }}>
                      预计: ¥{itinerary.estimatedBudget}
                    </span>
                  )}
                </Paragraph>
              </div>
            </div>
            {itinerary.preferences && (
              <Paragraph style={{ marginBottom: 0, marginTop: 8 }}>
                <strong>偏好：</strong>{itinerary.preferences}
              </Paragraph>
            )}
          </Card>

          {/* 行程总结 */}
          {itinerary.summary && (
            <Alert
              message="行程总结和建议"
              description={itinerary.summary}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          {/* 住宿总体建议 */}
          {itinerary.accommodationSummary && (
            <Alert
              message="住宿总体建议"
              description={itinerary.accommodationSummary}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          {/* 交通总体建议 */}
          {itinerary.transportationSummary && (
            <Alert
              message="交通总体建议"
              description={itinerary.transportationSummary}
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          {/* 美食总体建议 */}
          {itinerary.diningSummary && (
            <Alert
              message="美食总体建议"
              description={itinerary.diningSummary}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          

          
          {/* 实用建议列表 */}
          {itinerary.tips && itinerary.tips.length > 0 && (
            <Alert
              message="实用建议列表"
              description={itinerary.tips.join('；')}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
        </div>
      )
    },
    // 为每天创建一个标签页
    ...(itinerary.days || []).map((day) => ({
      key: `day-${day.day}`,
      label: `第 ${day.day} 天`,
      children: (
        <div className="day-itinerary" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Card size="small">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>第{day.day}天</h3>
              {day.date && <Tag color="blue">{day.date}</Tag>}
            </div>

            {/* 当日概要 */}
            {day.summary && (
              <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                <strong>今日概要：</strong>{day.summary}
              </Paragraph>
            )}

            {/* 按时间顺序展示所有活动 */}
            {day.activities && day.activities.length > 0 && (
              <List
                dataSource={day.activities}
                renderItem={(activity, actIndex) => (
                  <List.Item
                    key={actIndex}
                    className="activity-item"
                    style={{ 
                      borderBottom: actIndex < day.activities.length - 1 ? '1px solid #f0f0f0' : 'none', 
                      paddingBottom: 16, 
                      marginBottom: 16 
                    }}
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          {activity.time && <Tag color="blue">{activity.time}</Tag>}
                          <Tag color={getTypeColor(activity.type)}>{getTypeName(activity.type)}</Tag>
                          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{activity.name}</span>
                        </div>
                      }
                      description={
                        <div>
                          {activity.description && (
                            <Paragraph style={{ marginBottom: 8 }}>{activity.description}</Paragraph>
                          )}
                          
                          {/* 交通活动特有信息 */}
                          {(['交通', 'transportation'].includes(activity.type)) && activity.departure && activity.destination && (
                            <div style={{ marginBottom: 8, padding: 8, backgroundColor: '#f0f8ff', borderRadius: 4 }}>
                              <Paragraph style={{ margin: 0, fontSize: '14px' }}>
                                <strong>路线：</strong>{activity.departure} → {activity.destination}
                              </Paragraph>
                              {activity.route && (
                                <Paragraph style={{ margin: 0, fontSize: '14px' }}>
                                  <strong>详细路线：</strong>{activity.route}
                                </Paragraph>
                              )}
                            </div>
                          )}
                          
                          {/* 住宿活动特有信息 */}
                          {(['住宿', 'accommodation'].includes(activity.type)) && activity.checkInTime && (
                            <div style={{ marginBottom: 8, padding: 8, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
                              <Paragraph style={{ margin: 0, fontSize: '14px' }}>
                                <strong>入住/退房：</strong>{activity.checkInTime} / {activity.checkOutTime || '次日12:00'}
                              </Paragraph>
                              {activity.location && (
                                <Paragraph style={{ margin: 0, fontSize: '14px' }}>
                                  <strong>地点：</strong>{activity.location}
                                </Paragraph>
                              )}
                            </div>
                          )}
                          
                          {/* 餐厅活动特有信息 */}
                          {(['餐厅', 'dining'].includes(activity.type)) && activity.cuisine && (
                            <div style={{ marginBottom: 8, padding: 8, backgroundColor: '#fff2e8', borderRadius: 4 }}>
                              <Paragraph style={{ margin: 0, fontSize: '14px' }}>
                                <strong>菜系：</strong>{activity.cuisine}
                              </Paragraph>
                              {activity.location && (
                                <Paragraph style={{ margin: 0, fontSize: '14px' }}>
                                  <strong>地点：</strong>{activity.location}
                                </Paragraph>
                              )}
                              {activity.recommendedDishes && activity.recommendedDishes.length > 0 && (
                                <Paragraph style={{ margin: 0, fontSize: '14px' }}>
                                  <strong>推荐菜品：</strong>
                                  {activity.recommendedDishes.map((dish: string, dishIndex: number) => (
                                    <Tag key={dishIndex} color="pink" style={{ marginLeft: 4, marginRight: 4 }}>{dish}</Tag>
                                  ))}
                                </Paragraph>
                              )}
                            </div>
                          )}
                          
                          {/* 景点和其他活动的通用信息 */}
                          {(['景点', 'attraction'].includes(activity.type)) && (
                            <div>
                              {activity.location && (
                                <Paragraph style={{ margin: 0, marginBottom: 4, fontSize: '14px' }}>
                                  <strong>地点：</strong>{activity.location}
                                </Paragraph>
                              )}
                              {activity.duration && (
                                <Paragraph style={{ margin: 0, marginBottom: 4, fontSize: '14px' }}>
                                  <strong>时长：</strong>{activity.duration}
                                </Paragraph>
                              )}
                            </div>
                          )}
                          
                          {/* 花费信息 */}
                          {activity.cost && (
                            <Paragraph style={{ margin: 0, fontSize: '14px', color: '#f5222d' }}>
                              <strong>花费：</strong>¥{activity.cost}
                            </Paragraph>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </div>
      )
    })),
    {
      key: 'map',
      label: '地图',
      children: (
        <div className="map-view" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '16px 0' }}>
          <MapComponent itinerary={itinerary} />
        </div>
      )
    }
  ];

  return (
    <Tabs
      defaultActiveKey="overview"
      items={tabItems}
      type="card"
      tabBarStyle={{ marginBottom: '20px' }}
      size="large"
    />
  );
};

export default ItineraryDisplay;