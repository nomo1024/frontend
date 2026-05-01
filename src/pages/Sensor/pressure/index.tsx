import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, message, Spin } from 'antd';
import { PlayCircleOutlined, StopOutlined } from '@ant-design/icons';
import { startSensor, stopSensor, getSensorStatus, readSensorData } from '@/services/ant-design-pro/api';
import ReactECharts from 'echarts-for-react';

const PressureSensorPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();

  const fetchStatus = async () => {
    try {
      console.log('气压: 获取传感器状态...');
      const res = await getSensorStatus(4);
      console.log('气压: 状态响应', res);
      const running = res?.running ?? res?.data?.running ?? false;
      console.log('气压: 设置运行状态为', running);
      setIsRunning(running);
    } catch (error) {
      console.error('气压: 获取状态失败', error);
    }
  };

  const fetchInitialData = async () => {
    try {
      const res = await readSensorData(4, 5);
      console.log('气压初始数据:', JSON.stringify(res, null, 2));
      if (res && Array.isArray(res)) {
        const formatted = res.map((item: any) => ({
          time: item.collect_time || new Date(item.createTime || Date.now()).toLocaleTimeString(),
          value: parseFloat(item.col1 || item.value || item.pressureValue || 0),
        }));
        formatted.sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());
        setChartData(formatted);
      }
    } catch (error) {
      console.error('获取初始数据失败', error);
    }
  };

  const fetchData = async () => {
    try {
      const res = await readSensorData(4, 1);
      console.log('气压最新数据:', JSON.stringify(res, null, 2));
      if (res && Array.isArray(res)) {
        const newItem = {
          time: res[0].collect_time || new Date(res[0].createTime || Date.now()).toLocaleTimeString(),
          value: parseFloat(res[0].col1 || res[0].value || res[0].pressureValue || 0),
        };
        setChartData(prev => {
          const updated = [...prev, newItem];
          return updated.slice(-5);
        });
      }
    } catch (error) {
      console.error('获取数据失败', error);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      await startSensor(4);
      message.success('气压监测已启动');
      // 重新获取状态确认
      await fetchStatus();
    } catch (error) {
      message.error('启动失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await stopSensor(4);
      message.success('气压监测已停止');
      // 重新获取状态确认
      await fetchStatus();
    } catch (error) {
      message.error('停止失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchInitialData();
    // 定时刷新状态，确保与后端同步
    const statusTimer = setInterval(fetchStatus, 5000);
    return () => clearInterval(statusTimer);
  }, []);

  useEffect(() => {
    stopPolling();
    if (isRunning) {
      // 先立即获取一次数据
      fetchData();
      timerRef.current = setInterval(fetchData, 2000);
    }
    return () => stopPolling();
  }, [isRunning]);

  const stopPolling = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  };

  const chartOption = chartData.length > 0 ? {
    title: {
      text: '气压监测',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
    },
    animation: true,
    animationDuration: 600,
    animationEasing: 'cubicOut',
    xAxis: {
      type: 'category',
      data: chartData.map((d) => d.time),
      name: '时间',
    },
    yAxis: {
      type: 'value',
      name: '气压 (hPa)',
      min: 300,
      max: 1100,
      interval: 100,
    },
    series: [
      {
        data: chartData.map((d) => d.value),
        type: 'line',
        smooth: false,
        itemStyle: { color: '#722ed1' },
        lineStyle: {
          width: 2,
          type: 'solid',
        },
        animation: true,
        animationDuration: 600,
        animationEasing: 'cubicOut',
      },
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
  } : null;

  return (
    <Card
      title="气压监测"
      extra={
        <Button
          type={isRunning ? 'danger' : 'primary'}
          icon={isRunning ? <StopOutlined /> : <PlayCircleOutlined />}
          onClick={isRunning ? handleStop : handleStart}
          loading={loading}
        >
          {isRunning ? '停止监测' : '开始监测'}
        </Button>
      }
    >
      <Spin spinning={loading && chartData.length === 0}>
        {chartData.length > 0 && chartOption ? (
          <ReactECharts option={chartOption} style={{ height: '70vh' }} notMerge={false} />
        ) : (
          <div style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            暂无数据
          </div>
        )}
      </Spin>
    </Card>
  );
};

export default PressureSensorPage;
