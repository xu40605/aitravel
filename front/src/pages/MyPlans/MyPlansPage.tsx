import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, Button, Modal, message, Spin, Empty, Tag, Space, Popconfirm, Row, Col } from 'antd';
import { DeleteOutlined, EyeOutlined, CalendarOutlined, UserOutlined, DollarOutlined, EnvironmentOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getItineraries, deleteItinerary, type Itinerary } from '../../api/planner';

const { Title, Paragraph, Text } = Typography;

interface SavedItinerary extends Itinerary {
  id: string;
  name: string;
  createdAt: string;
}

const MyPlansPage: React.FC = () => {
  const navigate = useNavigate();
  const [itineraries, setItineraries] = useState<SavedItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItinerary, setSelectedItinerary] = useState<SavedItinerary | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // 加载行程列表
  const loadItineraries = async () => {
    try {
      setLoading(true);
      const response = await getItineraries();
      
      if (response.success && response.data) {
        setItineraries(response.data);
      } else {
        message.error(response.message || '获取行程列表失败');
      }
    } catch (error) {
      console.error('加载行程列表失败:', error);
      message.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 删除行程
  const handleDeleteItinerary = async (id: string) => {
    try {
      setDeletingId(id);
      const response = await deleteItinerary(id);
      
      if (response.success) {
        message.success('行程删除成功');
        loadItineraries(); // 重新加载列表
      } else {
        message.error(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除行程失败:', error);
      message.error('网络错误，请稍后重试');
    } finally {
      setDeletingId(null);
    }
  };

  // 查看行程详情
  const handleViewItinerary = (itinerary: SavedItinerary) => {
    setSelectedItinerary(itinerary);
    setDetailModalVisible(true);
  };

  // 跳转到费用管理页面
  const handleManageExpenses = (itineraryId: string) => {
    navigate(`/itineraries/${itineraryId}/expenses`);
  };

  // 计算行程天数
  const calculateDays = (startDate: string, endDate: string) => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    return end.diff(start, 'day') + 1;
  };

  // 格式化创建时间
  const formatCreatedAt = (dateStr: string) => {
    return dayjs(dateStr).format('YYYY-MM-DD HH:mm');
  };

  // 表格列配置
  const columns = [
    {
      title: '计划名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '目的地',
      dataIndex: 'destination',
      key: 'destination',
      ellipsis: true,
    },
    {
      title: '旅行时间',
      key: 'travelTime',
      render: (record: SavedItinerary) => (
        <span>
          {record.startDate} 至 {record.endDate}
          <Tag color="blue" style={{ marginLeft: 8 }}>
            {calculateDays(record.startDate, record.endDate)}天
          </Tag>
        </span>
      ),
    },
    {
      title: '创建时间',
      key: 'createdAt',
      render: (record: SavedItinerary) => formatCreatedAt(record.createdAt),
    },
    {
      title: '操作',
      key: 'action',
      render: (record: SavedItinerary) => (
        <Space size="middle">
          <Button 
              type="primary" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => handleViewItinerary(record)}
            >
              查看
            </Button>
            <Button
              icon={<FileTextOutlined />}
              size="small"
              onClick={() => handleManageExpenses(record.id)}
            >
              费用管理
            </Button>
          <Popconfirm
            title="确定删除此行程吗？"
            description="删除后无法恢复"
            onConfirm={() => handleDeleteItinerary(record.id)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            disabled={!!deletingId}
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
              loading={deletingId === record.id}
              disabled={!!deletingId}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 详情模态框内容
  const renderDetailContent = () => {
    if (!selectedItinerary) return null;

    return (
      <div className="itinerary-detail" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* 行程概览 */}
        <Card size="small" className="mb-4">
          <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>{selectedItinerary.name}</Title>
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Paragraph style={{ margin: 0 }}>
                <EnvironmentOutlined style={{ marginRight: 8 }} /> 
                <strong>目的地：</strong>{selectedItinerary.destination}
              </Paragraph>
              <Paragraph style={{ margin: 0 }}>
                <CalendarOutlined style={{ marginRight: 8 }} /> 
                <strong>日期：</strong>{selectedItinerary.startDate} 至 {selectedItinerary.endDate}
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  {calculateDays(selectedItinerary.startDate, selectedItinerary.endDate)}天
                </Tag>
              </Paragraph>
            </Col>
            <Col span={12}>
              <Paragraph style={{ margin: 0 }}>
                <UserOutlined style={{ marginRight: 8 }} /> 
                <strong>人数：</strong>{selectedItinerary.travelers}人
              </Paragraph>
              <Paragraph style={{ margin: 0 }}>
                <DollarOutlined style={{ marginRight: 8 }} /> 
                <strong>预算：</strong>¥{selectedItinerary.budget}
                {selectedItinerary.estimatedBudget && (
                  <Text type="success" style={{ marginLeft: 8 }}>
                    预计: ¥{selectedItinerary.estimatedBudget}
                  </Text>
                )}
              </Paragraph>
            </Col>
          </Row>
          {selectedItinerary.preferences && (
            <Paragraph style={{ marginBottom: 0, marginTop: 8 }}>
              <strong>偏好：</strong>{selectedItinerary.preferences}
            </Paragraph>
          )}
        </Card>

        {/* 行程总结 */}
        {selectedItinerary.summary && (
          <Card title="行程总结" size="small" className="mb-4">
            <Paragraph>{selectedItinerary.summary}</Paragraph>
          </Card>
        )}

        {/* 每日行程概览 */}
        <Card title="每日行程概览" size="small" className="mb-4">
          {selectedItinerary.days.map((day, index) => (
            <div key={day.day} className="mb-4" style={{ borderBottom: index < selectedItinerary.days.length - 1 ? '1px dashed #f0f0f0' : 'none', paddingBottom: 16 }}>
              <Text strong>第{day.day}天 ({day.date})</Text>
              <Paragraph style={{ marginLeft: 24, marginTop: 8 }}>{day.summary}</Paragraph>
            </div>
          ))}
        </Card>

        {/* 实用建议 */}
        {selectedItinerary.tips && selectedItinerary.tips.length > 0 && (
          <Card title="实用建议" size="small">
            {selectedItinerary.tips.map((tip, index) => (
              <div key={index} style={{ marginBottom: 8 }}>
                <Text mark>[{index + 1}]</Text>
                <Text style={{ marginLeft: 8 }}>{tip}</Text>
              </div>
            ))}
          </Card>
        )}
      </div>
    );
  };

  // 组件加载时获取行程列表
  useEffect(() => {
    loadItineraries();
  }, []);

  return (
    <div className="my-plans-page">
      <Card
        title={<Title level={2}>我的旅行计划</Title>}
        className="shadow-lg"
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Spin size="large" />
            <Paragraph style={{ marginTop: 16 }}>正在加载您的旅行计划...</Paragraph>
          </div>
        ) : itineraries.length === 0 ? (
          <Empty
            description="暂无保存的旅行计划"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '60px 20px' }}
          >
            <Paragraph type="secondary">
              您可以在行程生成页面创建并保存旅行计划
            </Paragraph>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={itineraries}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            scroll={{ x: 'max-content' }}
            rowClassName="hover:bg-gray-50"
          />
        )}
      </Card>

      {/* 行程详情模态框 */}
      <Modal
        title="行程详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
        centered
      >
        {renderDetailContent()}
      </Modal>
    </div>
  );
};

export default MyPlansPage;