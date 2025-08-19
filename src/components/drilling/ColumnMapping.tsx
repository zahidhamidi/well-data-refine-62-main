import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { DrillingData } from "./DrillingInterface";
import { ChannelBankItem } from './ChannelBank';
import { defaultChannels } from './ChannelBank';


type ColumnMappingProps = {
  data: DrillingData;
  channelBank: ChannelBankItem[];   // full channel objects
  onMappingComplete: (mappings: Array<{
    original: string;
    mapped: string;
    originalUnit: string;
    mappedUnit: string;
  }>) => void;
};

export const ColumnMapping = ({ data, channelBank, onMappingComplete }: ColumnMappingProps) => {
  const [mappings, setMappings] = useState(() => {
    return data.headers.map((header, index) => {
      const headerLower = header.toLowerCase().trim();

      // Step 1: Try exact alias match
      let matchedChannel = channelBank.find(channel =>
        channel.aliases.some(alias => alias.toLowerCase() === headerLower)
      );

      // Step 2: If no exact match, try partial match
      if (!matchedChannel) {
        matchedChannel = channelBank.find(channel =>
          channel.aliases.some(
            alias => headerLower.includes(alias.toLowerCase()) || alias.toLowerCase().includes(headerLower)
          )
        );
      }

      return {
        original: header,
        mapped: matchedChannel ? matchedChannel.standardName : '',
        originalUnit: data.units[index] || '',
        mappedUnit: matchedChannel ? data.units[index] || '' : ''
      };
    });
  });

  const [searchTerm, setSearchTerm] = useState("");

  const updateMapping = (index: number, field: 'mapped' | 'mappedUnit', value: string) => {
    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index], [field]: value };
    setMappings(newMappings);
  };

  const handleComplete = () => {
    onMappingComplete(mappings);
  };

  // Dropdown options are all standard names
  const standardChannels = channelBank.map(c => c.standardName);
  const standardUnits = ["ft", "m", "API", "ohm.m", "fraction", "g/cm3", "datetime", "sec"];

  const filteredChannels = standardChannels.filter(channel =>
    channel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Column Mapping Configuration
        </h2>
        <p className="text-muted-foreground">
          Map your channel headers to standardized drilling platform names
        </p>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="bg-table-header text-black p-4">
          <div className="grid grid-cols-4 gap-4 font-medium">
            <div>Original Header</div>
            <div>Mapped Channel</div>
            <div>Original Unit</div>
            <div>Mapped Unit</div>
          </div>
        </div>

        <div className="divide-y divide-border">
          {mappings.map((mapping, index) => (
            <div 
              key={index} 
              className={`p-4 grid grid-cols-4 gap-4 items-center ${
                index % 2 === 0 ? 'bg-background' : 'bg-table-row-even'
              } hover:bg-table-row-hover transition-colors`}
            >
              <div className="font-medium text-foreground">{mapping.original}</div>

              <div className="relative">
                <select
                  value={mapping.mapped}
                  onChange={(e) => updateMapping(index, 'mapped', e.target.value)}
                  className={`w-full p-2 border border-border rounded text-foreground focus:ring-2 focus:ring-primary focus:border-transparent
                    ${mapping.mapped 
                      ? 'bg-green-100'  // matched
                      : 'bg-red-100'    // no match
                    }
                  `}
                >
                  <option value="">Select channel...</option>
                  {standardChannels.map(channel => (
                    <option key={channel} value={channel}>{channel}</option>
                  ))}
                </select>
              </div>



              <div className="text-muted-foreground">{mapping.originalUnit || "N/A"}</div>

              <div>
                <select
                  value={mapping.mappedUnit}
                  onChange={(e) => updateMapping(index, 'mappedUnit', e.target.value)}
                  className="w-full p-2 border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select unit...</option>
                  {standardUnits.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <button
          onClick={handleComplete}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary-hover flex items-center space-x-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>Complete Mapping</span>
        </button>
      </div>
    </div>
  );
};
