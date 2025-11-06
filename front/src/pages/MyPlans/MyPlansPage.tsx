import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, Button, Modal, message, Spin, Empty, Tag, Space, Popconfirm } from 'antd';
import { DeleteOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getItineraries, deleteItinerary, type Itinerary } from '../../api/planner';
import ItineraryDisplay from '../../components/itinerary/ItineraryDisplay';

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
    
    return <ItineraryDisplay itinerary={selectedItinerary} />;
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