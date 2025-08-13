import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DrillChart: React.FC<DrillChartProps> = ({
  data,
  decimatedData,
  parameter,
  title,
  unit,
  color
}) => {
  // Use decimatedData if provided, otherwise use original data
  const baseData = decimatedData || data;

  // Filter out rows where tflo, rop, rpm, wob are all zero
  const filteredData = baseData.filter(
    (point) => !(point.tflo === 0 && point.rop === 0 && point.rpm === 0 && point.wob === 0)
  );

  const maxDepth = Math.max(...filteredData.map(d => d.depth), 0);

  // Generate ticks at every 500 interval from 0 to maxDepth
  const tickInterval = 500;
  const ticks = [];
  for (let i = 0; i <= maxDepth; i += tickInterval) {
    ticks.push(i);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {filteredData.length} points
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="depth"
                type="number"
                scale="linear"
                domain={[0, maxDepth]}
                ticks={ticks}
                allowDataOverflow={false}
                label={{ value: 'Depth', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                dataKey={parameter}
                type="number"
                domain={[0, 'dataMax']}
                label={{ 
                  value: `${title}`, 
                  angle: -90, 
                  position: 'insideLeft', 
                  dx: 10,  
                  dy: 80
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const xValue = Number(payload[0].payload.depth).toFixed(2); // Depth
                    const yValue = Number(payload[0].payload[parameter]).toFixed(2); // Parameter value
                    return (
                      <div style={{ background: 'white', padding: '5px', border: '1px solid #ccc' }}>
                        <div>{`${parameter.toUpperCase()} : ${yValue}`}</div>
                        <div>{`Depth: ${xValue}`}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter
                name={title}
                data={filteredData}  // <-- use filteredData here
                fill={color}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};


export default DrillChart;
