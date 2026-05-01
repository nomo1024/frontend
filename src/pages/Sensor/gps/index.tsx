import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, message, Spin, Alert } from 'antd';
import { PlayCircleOutlined, StopOutlined } from '@ant-design/icons';
import { startSensor, stopSensor, getSensorStatus, readSensorData } from '@/services/ant-design-pro/api';
import ReactECharts from 'echarts-for-react';

const GpsSensorPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout>();

  const fetchStatus = async () => {
    try {
      console.log('GPS: 获取传感器状态...');
      const res = await getSensorStatus(1);
      console.log('GPS: 状态响应', res);
      // 兼容多种返回格式
      const running = res?.running ?? res?.data?.running ?? false;
      console.log('GPS: 设置运行状态为', running);
      setIsRunning(running);
    } catch (error: any) {
      console.error('GPS: 获取状态失败', error);
    }
  };

  const fetchInitialData = async () => {
    try {
      setError('');
      // 首次进入获取最近5条数据
      const res = await readSensorData(1, 5);
      console.log('GPS初始数据:', JSON.stringify(res, null, 2));

      let dataArray = null;
      if (Array.isArray(res)) {
        dataArray = res;
      } else if (res && Array.isArray(res.data)) {
        dataArray = res.data;
      }

      if (dataArray && dataArray.length > 0) {
        const newData = dataArray.map((item: any) => ({
          time: item.collect_time || new Date().toLocaleTimeString(),
          value: parseFloat(item.col1 || 0),
        }));
        // 按时间正序排列，确保最新的在右侧
        newData.sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());
        setChartData(newData);
      }
    } catch (error: any) {
      console.error('获取初始数据失败', error);
    }
  };

  const fetchData = async () => {
    try {
      setError('');
      // 只获取最新1条数据
      const res = await readSensorData(1, 1);
      console.log('GPS最新数据:', JSON.stringify(res, null, 2));

      let dataArray = null;
      if (Array.isArray(res)) {
        dataArray = res;
      } else if (res && Array.isArray(res.data)) {
        dataArray = res.data;
      }

      if (dataArray && dataArray.length > 0) {
        const newItem = {
          time: dataArray[0].collect_time || new Date().toLocaleTimeString(),
          value: parseFloat(dataArray[0].col1 || 0),
        };

        // 追加新数据，保留最新5条
        setChartData(prev => {
          const updated = [...prev, newItem];
          return updated.slice(-5); // 只保留最后5条
        });
      }
    } catch (error: any) {
      console.error('获取数据失败', error);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      await startSensor(1);
      message.success('GPS监测已启动');
      // 重新获取状态确认
      await fetchStatus();
    } catch (error: any) {
      message.error('启动失败');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await stopSensor(1);
      message.success('GPS监测已停止');
      // 重新获取状态确认
      await fetchStatus();
    } catch (error: any) {
      message.error('停止失败');
      setError(error.message);
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
      text: 'GPS数据监测',
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
      name: '创建时间',
    },
    yAxis: {
      type: 'value',
      name: '海拔 (m)',
      min: 0,
      max: 9000,
      interval: 500,
      axisLabel: {
        show: true,
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          opacity: 0.3,
        },
      },
    },
    series: [
      {
        data: chartData.map((d) => d.value),
        type: 'line',
        smooth: true,
        itemStyle: { color: '#bc7c26' },
        areaStyle: {
          opacity: 0.3,
          color: '#ffffff',
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
      title="GPS监测"
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
      {error && (
        <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />
      )}
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

export default GpsSensorPage;
