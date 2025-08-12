import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataPoint {
  depth: number;
  wob: number;
  rpm: number;
  rop: number;
}

interface DrillChartProps {
  data: DataPoint[];
  decimatedData?: DataPoint[];
  parameter: 'wob' | 'rpm' | 'rop';
  title: string;
  unit: string;
  color: string;
}

const DrillChart: React.FC<DrillChartProps> = ({ 
  data, 
  decimatedData, 
  parameter, 
  title, 
  unit, 
  color 
}) => {
  const displayData = decimatedData || data;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {decimatedData ? `${decimatedData.length} points (decimated)` : `${data.length} points (original)`}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="depth" 
                domain={['dataMin', 'dataMax']}
                type="number"
                scale="linear"
                label={{ value: 'Depth (ft)', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                domain={['dataMin', 'dataMax']}
                label={{ value: `${title} (${unit})`, angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value, name) => [`${value} ${unit}`, title]}
                labelFormatter={(value) => `Depth: ${value} ft`}
              />
              
              {/* Original data (faded if decimated data exists) */}
              {decimatedData && (
                <Line
                  type="monotone"
                  dataKey={parameter}
                  data={data}
                  stroke={color}
                  strokeWidth={1}
                  strokeOpacity={0.3}
                  dot={false}
                  connectNulls={false}
                />
              )}
              
              {/* Main data line */}
              <Line
                type="monotone"
                dataKey={parameter}
                stroke={color}
                strokeWidth={decimatedData ? 3 : 2}
                dot={decimatedData ? { fill: color, strokeWidth: 2, r: 4 } : false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DrillChart;