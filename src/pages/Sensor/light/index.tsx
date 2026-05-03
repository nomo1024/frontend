import React, {useEffect, useRef, useState} from 'react';
import {Button, Card, message, Spin} from 'antd';
import {PlayCircleOutlined, StopOutlined} from '@ant-design/icons';
import {getSensorStatus, readSensorData, startSensor, stopSensor} from '@/services/ant-design-pro/api';
import ReactECharts from 'echarts-for-react';

const LightSensorPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();

  const fetchStatus = async () => {
    try {
      const res = await getSensorStatus(3);
      console.log('光照 状态响应:', res);
      let running = false;
      if (typeof res === 'boolean') running = res;
      else if (typeof res === 'string') running = res === '运行中' || res === 'running';
      else if (res) {
        if (res.source_3) running = res.source_3 === '运行中';
        else if (res.running !== undefined) running = res.running === true;
        else if (res.data) running = parseStatus(res.data, 3);
      }
      setIsRunning(running);
    } catch (error) {
      console.error('光照 获取状态失败', error);
    }
  };

  const parseStatus = (data: any, source: number): boolean => {
    if (typeof data === 'boolean') return data;
    if (typeof data === 'string') return data === '运行中' || data === 'running';
    if (data) {
      const key = `source_${source}`;
      if (data[key]) return data[key] === '运行中';
      if (data.running !== undefined) return data.running === true;
    }
    return false;
  };

  const fetchInitialData = async () => {
    try {
      const res = await readSensorData(3, 5);
      console.log('光照初始数据:', JSON.stringify(res, null, 2));
      if (res && Array.isArray(res)) {
        const formatted = res.map((item: any) => ({
          time: item.collect_time || new Date(item.createTime || Date.now()).toLocaleTimeString(),
          value: parseFloat(item.col1 || item.value || item.lightValue || 0),
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
      const res = await readSensorData(3, 1);
      console.log('光照最新数据:', JSON.stringify(res, null, 2));
      if (res && Array.isArray(res)) {
        const newItem = {
          time: res[0].collect_time || new Date(res[0].createTime || Date.now()).toLocaleTimeString(),
          value: parseFloat(res[0].col1 || res[0].value || res[0].lightValue || 0),
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
      await startSensor(3);
      message.success('光照监测已启动');
      setIsRunning(true);
    } catch (error) {
      message.error('启动失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await stopSensor(3);
      message.success('光照监测已停止');
      setIsRunning(false);
    } catch (error) {
      message.error('停止失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchInitialData();
    const statusInterval = setInterval(fetchStatus, 3000);
    return () => clearInterval(statusInterval);
  }, []);

  useEffect(() => {
    stopPolling();
    if (isRunning) {
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
      text: '',
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
      name: '光照强度 (kLux)',
      min: 0,
      max: 100,
      interval: 10,
      axisLabel: {
        formatter: (value: number) => value + 'k',
      },
    },
    series: [
      {
        data: chartData.map((d) => d.value),
        type: 'line',
        smooth: true,
        itemStyle: { color: '#faad14' },
        areaStyle: {
          opacity: 0.6,
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#faad14' },
              { offset: 1, color: 'rgba(250, 173, 20, 0.1)' },
            ],
          },
        },
        lineStyle: {
          width: 2,
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
      title={<div style={{ textAlign: 'center', width: '100%' }}>光照监测</div>}
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

export default LightSensorPage;
