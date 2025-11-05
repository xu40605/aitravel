import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Form, Input, InputNumber, DatePicker, Button, Card, Spin, message, Typography, Empty, Divider, Alert, List, Tag, Modal, Tabs } from 'antd';
import dayjs from 'dayjs';
import { AudioOutlined, SaveOutlined } from '@ant-design/icons';
import { generateItinerary, saveItinerary, type PlannerRequest, type Itinerary, type SaveItineraryRequest } from '../../api/planner';
import { VoiceInput } from '../../components/voice/VoiceInput';

const { Content } = Layout;
const { TextArea } = Input;
const { Title, Paragraph } = Typography;

// Builder模式实现旅行计划页面
class PlannerPageBuilder {
  private form: any = null;
  private onVoiceInputChange: (text: string) => void = () => {};
  private onShowVoiceInput: (fieldKey: string) => void = () => {};
  private isSubmitting: boolean = false;
  private isSaving: boolean = false;
  private showSaveModal: boolean = false;
  private itineraryName: string = '';
  private showVoiceModal: { [key: string]: boolean } = {};
  private itinerary: Itinerary | null = null;
  private isFirstRender: { current: boolean } = { current: true };
  private stateUpdaters: {
    setIsSubmitting?: (value: boolean) => void;
    setItinerary?: (value: Itinerary | null) => void;
    setIsSaving?: (value: boolean) => void;
    setShowSaveModal?: (value: boolean) => void;
    setItineraryName?: (value: string) => void;
  } = {};

  setForm(form: any): PlannerPageBuilder {
    this.form = form;
    return this;
  }

  setOnVoiceInputChange(handler: (text: string) => void): PlannerPageBuilder {
    this.onVoiceInputChange = handler;
    return this;
  }

  setOnShowVoiceInput(handler: (fieldKey: string) => void): PlannerPageBuilder {
    this.onShowVoiceInput = handler;
    return this;
  }

  setIsSubmitting(submitting: boolean): PlannerPageBuilder {
    this.isSubmitting = submitting;
    // 更新React状态
    if (this.stateUpdaters.setIsSubmitting) {
      this.stateUpdaters.setIsSubmitting(submitting);
    }
    return this;
  }

  // 语音字段键设置方法
  // 保留方法以便未来扩展，使用下划线前缀表示参数暂未使用
  setVoiceFieldKey(_key: string): PlannerPageBuilder {
    return this;
  }

  setShowVoiceModal(modalState: { [key: string]: boolean }): PlannerPageBuilder {
    this.showVoiceModal = modalState;
    return this;
  }

  setStateUpdaters(updaters: {
    setIsSubmitting?: (value: boolean) => void;
    setItinerary?: (value: Itinerary | null) => void;
    setIsSaving?: (value: boolean) => void;
    setShowSaveModal?: (value: boolean) => void;
    setItineraryName?: (value: string) => void;
  }): PlannerPageBuilder {
    this.stateUpdaters = updaters;
    return this;
  }

  setIsSaving(saving: boolean): PlannerPageBuilder {
    this.isSaving = saving;
    if (this.stateUpdaters.setIsSaving) {
      this.stateUpdaters.setIsSaving(saving);
    }
    return this;
  }

  setShowSaveModal(show: boolean): PlannerPageBuilder {
    this.showSaveModal = show;
    if (this.stateUpdaters.setShowSaveModal) {
      this.stateUpdaters.setShowSaveModal(show);
    }
    return this;
  }

  setItineraryName(name: string): PlannerPageBuilder {
    this.itineraryName = name;
    if (this.stateUpdaters.setItineraryName) {
      this.stateUpdaters.setItineraryName(name);
    }
    return this;
  }

  setItinerary(data: Itinerary | null): PlannerPageBuilder {
    this.itinerary = data;
    // 更新React状态
    if (this.stateUpdaters.setItinerary) {
      this.stateUpdaters.setItinerary(data);
    }
    return this;
  }

  buildFormItem(label: string, name: string, required: boolean = false, rules?: any[]) {
    const formItem = (
      <Form.Item
        label={label}
        name={name}
        rules={required ? [...(rules || []), { required: true, message: `请输入${label}` }] : rules}
      >
        {this.buildFormField(name)}
      </Form.Item>
    );
    return formItem;
  }

  buildFormField(fieldKey: string) {
    // 为日期字段提供特殊处理，避免被Row/Col包裹导致表单无法收集值
    if (fieldKey === 'date') {
      return (
        <DatePicker.RangePicker
          style={{ width: '100%' }}
          format="YYYY-MM-DD"
          disabledDate={(current) => current && current < dayjs().startOf('day')}
          placeholder={['开始日期', '结束日期']}
        />
      );
    }
    
    const renderField = () => {
      switch (fieldKey) {
        case 'travelers':
        case 'budget':
          return <InputNumber min={1} style={{ width: '100%' }} placeholder={`请输入${fieldKey === 'travelers' ? '人数' : '预算（元）'}`} />;
        case 'preferences':
          return <TextArea rows={4} placeholder="请输入旅行偏好，如美食、购物、文化等" />;
        default:
          return <Input placeholder={`请输入${fieldKey === 'destination' ? '目的地' : ''}`} />;
      }
    };

    return (
      <Row gutter={8} align="middle">
        <Col span={20}>
          {renderField()}
        </Col>
        <Col span={4}>
          <Button
              type="default"
            icon={<AudioOutlined />}
            onClick={() => this.onShowVoiceInput(fieldKey)}
          >
            语音
          </Button>
        </Col>
      </Row>
    );
  }

  buildVoiceModal() {
    // 过滤出显示状态为true的字段
    const activeFields = Object.keys(this.showVoiceModal).filter(fieldKey => this.showVoiceModal[fieldKey]);
    
    const modalContent = activeFields.map(fieldKey => {
        const getPlaceholder = () => {
          switch (fieldKey) {
            case 'destination': return '请按住说话，说出您的目的地';
            case 'date': return '请按住说话，说出您的旅行时间，如"5月1日到5月5日"';
            case 'travelers': return '请按住说话，说出您的人数，如"2人"';
            case 'budget': return '请按住说话，说出您的预算，如"5000元"';
            case 'preferences': return '请按住说话，描述您的旅行偏好';
            default: return '请按住说话';
          }
        };

        return (
          <Card
            key={fieldKey}
            title="语音输入"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              width: '400px',
              maxWidth: '90%',
            }}
            extra={<Button type="text" onClick={() => this.setShowVoiceModal({})}>关闭</Button>}
          >
            <VoiceInput
              onTextChange={this.onVoiceInputChange}
              placeholder={getPlaceholder()}
            />
          </Card>
        );
      });

    const hasActiveModal = Object.values(this.showVoiceModal).some(Boolean);
    
    return (
      <>
        {modalContent}
        {hasActiveModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
            }}
            onClick={() => this.setShowVoiceModal({})}
          />
        )}
      </>
    );
  }

  buildSubmitButton() {
    return (
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          style={{ width: '100%', height: '40px', fontSize: '16px' }}
          loading={this.isSubmitting}
        >
          {this.isSubmitting ? (
            <>
              <Spin size="small" style={{ marginRight: 8 }} />
              生成中...
            </>
          ) : (
            '生成行程'
          )}
        </Button>
      </Form.Item>
    );
  }

  handleSaveItinerary = async () => {
    if (!this.itinerary || !this.itineraryName.trim()) {
      message.error('请输入有效的行程名称');
      return;
    }

    try {
      this.setIsSaving(true);
      const request: SaveItineraryRequest = {
        name: this.itineraryName.trim(),
        itinerary: this.itinerary
      };

      const response = await saveItinerary(request);
      
      if (response.success) {
        message.success('行程保存成功！');
        this.setShowSaveModal(false);
        this.setItineraryName('');
        // 可以跳转到我的计划页面或做其他操作
      } else {
        message.error(response.message || '行程保存失败，请稍后重试');
      }
    } catch (error) {
      console.error('保存行程失败:', error);
      message.error('网络错误，请稍后重试');
    } finally {
      this.setIsSaving(false);
    }
  };

  buildSaveModal() {
    return (
      <Modal
        title="保存旅行计划"
        open={this.showSaveModal}
        onOk={this.handleSaveItinerary}
        onCancel={() => {
          this.setShowSaveModal(false);
          this.setItineraryName('');
        }}
        okButtonProps={{ loading: this.isSaving }}
        cancelButtonProps={{ disabled: this.isSaving }}
      >
        <Form.Item
          label="计划名称"
          required
          tooltip="请为您的旅行计划起一个名字"
        >
          <Input
            placeholder="例如：北京五日游"
            value={this.itineraryName}
            onChange={(e) => this.setItineraryName(e.target.value)}
            onPressEnter={this.handleSaveItinerary}
            disabled={this.isSaving}
          />
        </Form.Item>
        <Paragraph type="secondary">
          保存后，您可以在「我的旅行计划」页面查看和管理此行程
        </Paragraph>
      </Modal>
    );
  }

  buildItineraryDisplay() {
    if (this.isSubmitting) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: 16 }}>正在生成旅行计划...</Paragraph>
          <Paragraph type="secondary" style={{ marginTop: 8 }}>复杂行程可能需要较长时间，请耐心等待</Paragraph>
        </div>
      );
    }

    if (this.itinerary) {
      // 构建标签页数据
      const tabItems = [
        {
          key: 'overview',
          label: '总览',
          children: (
            <div className="itinerary-overview" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* 行程概览卡片 */}
              <Card 
                size="small" 
                className="mb-4"
                extra={
                  <Button 
                    type="primary" 
                    icon={<SaveOutlined />}
                    onClick={() => this.setShowSaveModal(true)}
                    disabled={this.isSaving}
                  >
                    保存计划
                  </Button>
                }
              >
                <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>{this.itinerary.destination} 旅行计划</Title>
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <Paragraph style={{ margin: 0 }}>
                      <strong>日期：</strong>{this.itinerary.startDate} 至 {this.itinerary.endDate}
                    </Paragraph>
                    <Paragraph style={{ margin: 0 }}>
                      <strong>人数：</strong>{this.itinerary.travelers}人
                    </Paragraph>
                  </Col>
                  <Col span={12}>
                    <Paragraph style={{ margin: 0 }}>
                      <strong>预算：</strong>¥{this.itinerary.budget}
                    </Paragraph>
                    {this.itinerary.estimatedBudget && (
                      <Paragraph style={{ margin: 0, color: '#1890ff' }}>
                        <strong>预计花费：</strong>¥{this.itinerary.estimatedBudget}
                      </Paragraph>
                    )}
                  </Col>
                </Row>
                {this.itinerary.preferences && (
                  <Paragraph style={{ marginBottom: 0, marginTop: 8 }}>
                    <strong>偏好：</strong>{this.itinerary.preferences}
                  </Paragraph>
                )}
                {this.itinerary.summary && (
                  <Alert
                    message="行程总结和建议"
                    description={this.itinerary.summary}
                    type="info"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
                
                {/* 住宿总体建议 */}
                {this.itinerary.accommodationSummary && (
                  <Alert
                    message="住宿总体建议"
                    description={this.itinerary.accommodationSummary}
                    type="warning"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
                
                {/* 交通总体建议 */}
                {this.itinerary.transportationSummary && (
                  <Alert
                    message="交通总体建议"
                    description={this.itinerary.transportationSummary}
                    type="success"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
                
                {/* 美食总体建议 */}
                {this.itinerary.diningSummary && (
                  <Alert
                    message="美食总体建议"
                    description={this.itinerary.diningSummary}
                    type="info"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
                
                {/* 实用建议 */}
                {this.itinerary.tips && this.itinerary.tips.length > 0 && (
                  <Card size="small" title="实用建议" style={{ marginTop: 16 }}>
                    <List
                      dataSource={this.itinerary.tips}
                      renderItem={(tip, index) => (
                        <List.Item>
                          <span style={{ marginRight: 8 }}>{index + 1}.</span>
                          {tip}
                        </List.Item>
                      )}
                    />
                  </Card>
                )}
              </Card>
            </div>
          )
        },
        // 为每天创建一个标签页
        ...this.itinerary.days.map((day) => ({
          key: `day-${day.day}`,
          label: `第 ${day.day} 天`,
          children: (
            <div className="day-itinerary" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <Card 
                key={day.day} 
                size="small"
              >
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
                
                {/* 按时间顺序展示所有活动（包含景点、交通、餐厅、住宿） */}
                <Card 
                  type="inner" 
                  title="按时间顺序的行程安排" 
                  size="small"
                >
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
                              <Tag color="blue">{activity.time}</Tag>
                              {activity.type === '交通' && <Tag color="cyan">{activity.transportType || activity.type}</Tag>}
                              {activity.type === '餐厅' && <Tag color="red">{activity.type} ({activity.mealType})</Tag>}
                              {activity.type === '住宿' && <Tag color="green">{activity.type}</Tag>}
                              {activity.type === '景点' && <Tag color="orange">{activity.type}</Tag>}
                              {!['交通', '餐厅', '住宿', '景点'].includes(activity.type) && 
                                <Tag color="purple">{activity.type}</Tag>
                              }
                              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{activity.name}</span>
                            </div>
                          }
                          description={
                            <div>
                              <Paragraph style={{ marginBottom: 8 }}>{activity.description}</Paragraph>
                              
                              {/* 交通活动特有信息 */}
                              {activity.type === '交通' && activity.departure && activity.destination && (
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
                              {activity.type === '住宿' && activity.checkInTime && (
                                <div style={{ marginBottom: 8, padding: 8, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
                                  <Paragraph style={{ margin: 0, fontSize: '14px' }}>
                                    <strong>入住/退房：</strong>{activity.checkInTime} / {activity.checkOutTime || '次日12:00'}
                                  </Paragraph>
                                </div>
                              )}
                              
                              {/* 餐厅活动特有信息 */}
                              {activity.type === '餐厅' && activity.cuisine && (
                                <div style={{ marginBottom: 8, padding: 8, backgroundColor: '#fff2e8', borderRadius: 4 }}>
                                  <Paragraph style={{ margin: 0, fontSize: '14px' }}>
                                    <strong>菜系：</strong>{activity.cuisine}
                                  </Paragraph>
                                  {activity.recommendedDishes && activity.recommendedDishes.length > 0 && (
                                    <Paragraph style={{ margin: 0, fontSize: '14px' }}>
                                      <strong>推荐菜品：</strong>
                                      {activity.recommendedDishes.map((dish, dishIndex) => (
                                        <Tag key={dishIndex} color="pink" style={{ marginLeft: 4, marginRight: 4 }}>{dish}</Tag>
                                      ))}
                                    </Paragraph>
                                  )}
                                </div>
                              )}
                              
                              {/* 通用信息标签 */}
                              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                                {activity.location && (
                                  <Tag color="purple">地点：{activity.location}</Tag>
                                )}
                                {activity.duration && (
                                  <Tag color="blue">时长：{activity.duration}</Tag>
                                )}
                                {activity.cost && (
                                  <Tag color="red">花费：{typeof activity.cost === 'number' ? '¥' + activity.cost : activity.cost}</Tag>
                                )}
                              </div>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Card>
            </div>
          )
        }))
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
    }

    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', minHeight: '400px' }}>
        <Empty
          description="暂无行程信息"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
        <Paragraph type="secondary" style={{ marginTop: 16 }}>
          请在左侧填写旅行信息并点击生成行程按钮
        </Paragraph>
      </div>
    );
  }

  build(): React.ReactNode {
    return (
      <Layout className="min-h-screen">
        <Content className="p-6">
          <Row gutter={[24, 24]}>
            {/* 左侧输入区域 - 40% 宽度 */}
            <Col xs={24} md={10}>
              <Card title="旅行信息输入" className="shadow-lg">
                <Form
                  form={this.form}
                  layout="vertical"
                  onValuesChange={(changedValues, allValues) => {
                    // 避免首次渲染时触发
                    if (this.isFirstRender.current) return;
                    
                    console.log('表单值变化:', changedValues, allValues);
                    // 实时保存表单数据，排除日期对象
                    const formDataToSave = {
                      destination: allValues.destination,
                      travelers: allValues.travelers,
                      budget: allValues.budget,
                      preferences: allValues.preferences
                    };
                    localStorage.setItem('plannerFormData', JSON.stringify(formDataToSave));
                    console.log('已保存表单数据:', formDataToSave);
                  }}
                  onFinish={async (values) => {
                    // 保存表单数据到localStorage
                    localStorage.setItem('plannerFormData', JSON.stringify(values));
                    // 继续原有逻辑
                    try {
                      // 转换日期格式
                      // 确保日期值存在且有效
                      if (!values.date || !Array.isArray(values.date) || values.date.length < 2 || !values.date[0] || !values.date[1]) {
                        message.error('请选择有效的旅行时间');
                        return;
                      }
                      
                      const startDate = values.date[0].format('YYYY-MM-DD');
                      const endDate = values.date[1].format('YYYY-MM-DD');
                        
                      // 验证日期有效性
                      if (values.date[1].isBefore(values.date[0])) {
                        message.error('结束日期不能早于开始日期');
                        return;
                      }
                      
                      // 保存表单数据（排除日期对象，因为它包含不能序列化的方法）
                      const formDataToSave = {
                        destination: values.destination,
                        travelers: values.travelers,
                        budget: values.budget,
                        preferences: values.preferences
                      };
                      localStorage.setItem('plannerFormData', JSON.stringify(formDataToSave));
                      
                      const requestData: PlannerRequest = {
                        destination: values.destination.trim(),
                        startDate,
                        endDate,
                        travelers: Number(values.travelers),
                        budget: Number(values.budget),
                        preferences: values.preferences?.trim(),
                      };
                        
                      this.setIsSubmitting(true);
                      message.loading('正在生成行程计划，请稍候...', 0);
                        
                      try {
                        const response = await generateItinerary(requestData);
                        
                        if (response.success && response.data?.parsed) {
                          message.destroy();
                          message.success('行程生成成功！');
                          
                          // 完善行程数据
                          const enhancedItinerary: Itinerary = {
                            ...response.data.parsed,
                            destination: requestData.destination,
                            startDate: requestData.startDate,
                            endDate: requestData.endDate,
                            travelers: requestData.travelers,
                            budget: requestData.budget,
                            preferences: requestData.preferences,
                          };
                          
                          this.setItinerary(enhancedItinerary);
                        } else {
                          message.destroy();
                          message.error(response.message || '行程生成失败，请稍后重试');
                          this.setItinerary(null);
                        }
                      } catch (apiError) {
                        message.destroy();
                        message.error('API调用失败，请检查网络连接后重试');
                        this.setItinerary(null);
                        console.error('API调用错误:', apiError);
                      }
                    } catch (error) {
                      message.destroy();
                      message.error('表单验证失败，请检查输入');
                    } finally {
                      this.setIsSubmitting(false);
                    }
                  }}
                >
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      {this.buildFormItem('地点', 'destination', true)}
                    </Col>
                    <Col span={24}>
                      {this.buildFormItem('时间', 'date', true)}
                    </Col>
                    <Col span={24}>
                      {this.buildFormItem('人数', 'travelers', true)}
                    </Col>
                    <Col span={24}>
                      {this.buildFormItem('预算', 'budget', true)}
                    </Col>
                    <Col span={24}>
                      {this.buildFormItem('旅行偏好', 'preferences', false)}
                    </Col>
                  </Row>
                  {this.buildSubmitButton()}
                </Form>
              </Card>
            </Col>
            
            {/* 右侧结果展示区域 - 60% 宽度 */}
            <Col xs={24} md={14}>
              <Card title="AI 生成的旅行计划" className="shadow-lg" style={{ height: '100%' }}>
                {this.buildItineraryDisplay()}
              </Card>
            </Col>
          </Row>
          {this.buildVoiceModal()}
          {this.buildSaveModal()}
        </Content>
      </Layout>
    );
  }
}

const PlannerPage: React.FC = () => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [itineraryName, setItineraryName] = useState('');
  const [showVoiceModal, setShowVoiceModal] = useState<{ [key: string]: boolean }>({});
  const [voiceFieldKey, setVoiceFieldKey] = useState<string>('');
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  
  // 从localStorage加载保存的数据
  useEffect(() => {
    // 加载表单数据
    const savedFormData = localStorage.getItem('plannerFormData');
    if (savedFormData) {
      try {
        const formData = JSON.parse(savedFormData);
        console.log('加载的表单数据:', formData);
        // 确保日期字段不被包含在加载中
        const { date, ...otherFields } = formData;
        // 设置表单值
        form.setFieldsValue(otherFields);
      } catch (error) {
        console.error('加载表单数据失败:', error);
      }
    }
    
    // 加载行程数据
    const savedItinerary = localStorage.getItem('plannerItinerary');
    if (savedItinerary) {
      try {
        setItinerary(JSON.parse(savedItinerary));
      } catch (error) {
        console.error('加载行程数据失败:', error);
      }
    }
  }, [form]);


  
  // 组件卸载前保存表单数据
  useEffect(() => {
    return () => {
      try {
        const formValues = form.getFieldsValue();
        if (formValues) {
          // 保存非日期字段
          const formDataToSave = {
            destination: formValues.destination,
            travelers: formValues.travelers,
            budget: formValues.budget,
            preferences: formValues.preferences
          };
          localStorage.setItem('plannerFormData', JSON.stringify(formDataToSave));
          console.log('组件卸载时保存表单数据:', formDataToSave);
        }
      } catch (error) {
        console.error('卸载时保存表单数据失败:', error);
      }
    };
  }, [form]);
  
  // 定期保存表单数据作为额外保障
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const formValues = form.getFieldsValue();
        if (formValues) {
          const formDataToSave = {
            destination: formValues.destination,
            travelers: formValues.travelers,
            budget: formValues.budget,
            preferences: formValues.preferences
          };
          localStorage.setItem('plannerFormData', JSON.stringify(formDataToSave));
        }
      } catch (error) {
        console.error('定期保存表单数据失败:', error);
      }
    }, 5000); // 每5秒保存一次
    
    return () => clearInterval(interval);
  }, [form]);
  
  // 保存行程数据到localStorage
  useEffect(() => {
    if (itinerary) {
      localStorage.setItem('plannerItinerary', JSON.stringify(itinerary));
    }
  }, [itinerary]);

  const handleVoiceInputChange = (text: string) => {
    if (voiceFieldKey) {
      form.setFieldValue(voiceFieldKey, text);
      
      // 立即保存表单数据
      setTimeout(() => {
        try {
          const formValues = form.getFieldsValue();
          const formDataToSave = {
            destination: formValues.destination,
            travelers: formValues.travelers,
            budget: formValues.budget,
            preferences: formValues.preferences
          };
          localStorage.setItem('plannerFormData', JSON.stringify(formDataToSave));
          console.log('语音输入后保存表单数据:', formDataToSave);
        } catch (error) {
          console.error('语音输入后保存表单数据失败:', error);
        }
      }, 0);
    }
    setShowVoiceModal({});
    setVoiceFieldKey('');
  };

  const showVoiceInput = (fieldKey: string) => {
    setVoiceFieldKey(fieldKey);
    setShowVoiceModal({ [fieldKey]: true });
  };

  // 创建Builder实例并配置
  const builder = new PlannerPageBuilder()
    .setForm(form)
    .setIsSubmitting(isSubmitting)
    .setIsSaving(isSaving)
    .setShowSaveModal(showSaveModal)
    .setItineraryName(itineraryName)
    .setVoiceFieldKey(voiceFieldKey)
    .setShowVoiceModal(showVoiceModal)
    .setItinerary(itinerary)
    .setOnVoiceInputChange(handleVoiceInputChange)
    .setOnShowVoiceInput(showVoiceInput)
    // 添加状态更新器
    .setStateUpdaters({
      setIsSubmitting,
      setItinerary,
      setIsSaving,
      setShowSaveModal,
      setItineraryName
    });

  return builder.build();
};
// 确保dayjs已正确导入，此处为兼容保障

export default PlannerPage;
