import { useState, useEffect } from "react";
import { Search, Plus, Edit3, Trash2, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type ChannelBankItem = {
  id: string;
  standardName: string;
  aliases: string[];
};



type ChannelBankProps = {
  onChannelBankUpdate?: (channels: ChannelBankItem[]) => void;
};

export const defaultChannels: ChannelBankItem[] = [
  {
    id: '1',
    standardName: 'ML_BDTI',
    aliases: ['bdti', 'bit drilled time', 'bit drill time', 'bit time']
  },
  {
    id: '2',
    standardName: 'ML_CHKP',
    aliases: ['chkp', 'casing pressure', 'casing avg']
  },
  {
    id: '3',
    standardName: 'ML_BDDI',
    aliases: ['bit run', 'bddi']
  },
  {
    id: '4',
    standardName: 'ML_BPOS',
    aliases: ['bpos', 'block position', 'weight on hook', 'woh','hook position','hpos','blkpos','blkposcomp']
  },
  {
    id: '5',
    standardName: 'ML_DBTM',
    aliases: ['dbtm', 'bit depth', 'bit position', 'depbitmd','bit measured depth']
  },
  {
    id: '6',
    standardName: 'ML_DBTV',
    aliases: ['dbtv', 'bit vertical depth', 'bit position vertical']
  },
  {
    id: '7',
    standardName: 'ML_DMEA',
    aliases: ['dmea', 'hole depth','tmd']
  },
  {
    id: '8',
    standardName: 'ML_DRTM',
    aliases: ['drtm', 'ld shakers']
  },
  {
    id: '9',
    standardName: 'ML_DVER',
    aliases: ['dver', 'vertical depth', 'tvd', 'deptvd']
  },
  {
    id: '10',
    standardName: 'ML_DEXP',
    aliases: ['dexp', 'exponent']
  },
  {
    id: '11',
    standardName: 'ML_FOUTPDL',
    aliases: ['flowout paddle']
  },
  {
    id: '12',
    standardName: 'ML_GASA',
    aliases: ['gas average', 'gast', 'tgas', 'total gas out']
  },
  {
    id: '13',
    standardName: 'ML_HECD',
    aliases: ['hecd', 'ecd', 'equivalent circulating density', 'equivalent circulation density']
  },
  {
    id: '14',
    standardName: 'ML_HKLD',
    aliases: ['hookload', 'hkld', 'hkl', 'weight on hook','hook load','woh']
  },
  {
    id: '15',
    standardName: 'ML_HKLX',
    aliases: ['hklx', 'hook load max', 'hookload max']
  },
  {
    id: '16',
    standardName: 'ML_MDIA',
    aliases: ['mdia', 'mud in', 'mud weight in', 'mudweight in','mud density in','muddensity in','mwi','din'],
  },
  {
    id: '17',
    standardName: 'ML_MDOA',
    aliases: ['mdoa', 'mud out', 'mud weight out', 'mudweight out','mud density out','muddensity out','mwo','dout','density out']
  },
  {
    id: '18',
    standardName: 'ML_MFIA',
    aliases: ['mfia', 'mud in', 'mud flow in', 'flow in']
  },
  {
    id: '19',
    standardName: 'ML_MFOA',
    aliases: ['mfoa', 'mud out', 'mud flow out', 'flow out']
  },
  {
    id: '20',
    standardName: 'ML_MFOP',
    aliases: ['mfop', 'mud out percent', 'flow paddle']
  },
  {
    id: '21',
    standardName: 'ML_MotorRPM',
    aliases: ['mud motor rpm', 'rpmmi']
  },
  {
    id: '22',
    standardName: 'ML_MTIA',
    aliases: ['mtia', 'mud temperature in', 'temp in', 'tin']
  },
  {
    id: '23',
    standardName: 'ML_MTOA',
    aliases: ['mtoa', 'mud rtemperature out', 'mud flow out', 'flow out']
  },
  {
    id: '24',
    standardName: 'ML_MWTI',
    aliases: ["mud in","mud weight in","mudweight in","mud density in","muddensity in","mwi"]
  },
  {
    id: '25',
    standardName: 'ML_ROP',
    aliases: ["rop","rate of penetration"]
  },
  {
    id: '26',
    standardName: 'ML_RPM',
    aliases: ["rpm","rotary rpm"]
  },
  {
    id: '27',
    standardName: 'ML_RPMA',
    aliases: ["rpm","rpm avg","rpm total avg","rpm total average"]
  },
  {
    id: '28',
    standardName: 'ML_SPM1',
    aliases: ["spm1","pump1","pump #1","spm01"]
  },
  {
    id: '29',
    standardName: 'ML_SPM2',
    aliases: ["spm2","pump2","pump #2","spm02"]
  },
  {
    id: '30',
    standardName: 'ML_SPM3',
    aliases: ["spm3","pump3","pump #3","spm03"]
  },
  {
    id: '33',
    standardName: 'ML_SPM4',
    aliases: ["spm4","pump4","pump #4","spm04"]
  },
  {
    id: '34',
    standardName: 'ML_TSTK',
    aliases: ["tstk"]
  },
  {
    id: '35',
    standardName: 'ML_TTV1',
    aliases: ["ttv","ttv1","trip tank volume 1"]
  },
  {
    id: '36',
    standardName: 'ML_TTV2',
    aliases: ["ttv2","trip tank volume 2"]
  },
  {
    id: '37',
    standardName: 'ML_TV01',
    aliases: ["tvt1","tv1","tv01","pit volume 1","pit 1 volume","pit1"]
  },
  {
    id: '38',
    standardName: 'ML_TV02',
    aliases: ["tv02","tv2","pit volume 2","pit 2 volume","pit2"]
  },
  {
    id: '39',
    standardName: 'ML_TV03',
    aliases: ["tv03","tv3","pit volume 3","pit 3 volume","pit3"]
  },
  {
    id: '40',
    standardName: 'ML_TV04',
    aliases: ["tv04","tv4","pit volume 4","pit 4 volume","pit4"]
  },
  {
    id: '41',
    standardName: 'ML_TV05',
    aliases: ["tv05","tv5","pit volume 5","pit 5 volume","pit5"]
  },
  {
    id: '42',
    standardName: 'ML_TV06',
    aliases: ["tv06","tv6","pit volume 6","pit 6 volume","pit6"]
  },
  {
    id: '43',
    standardName: 'ML_TV07',
    aliases: ["tv07","tv7","pit volume 7","pit 7 volume","pit7"]
  },
  {
    id: '44',
    standardName: 'ML_TV08',
    aliases: ["tv08","tv8","pit volume 8","pit 8 volume","pit8"]
  },
  {
    id: '45',
    standardName: 'ML_TV09',
    aliases: ["tv09","tv9","pit volume 9","pit 9 volume","pit9"]
  },
  {
    id: '46',
    standardName: 'ML_TV10',
    aliases: ["tv10","pit volume 10","pit 10 volume","pit10"]
  },
  {
    id: '47',
    standardName: 'ML_TVA',
    aliases: ["tank volume","tva","total pits","active volume"]
  },
  {
    id: '48',
    standardName: 'ML_TVT',
    aliases: ["pit total volume","pit total vol.","tvt"]
  },
  {
    id: '49',
    standardName: 'ML_TVCA',
    aliases: ["tvca","total active volume"]
  },
  {
    id: '50',
    standardName: 'ML_TVCT',
    aliases: ["tvct"]
  },
  {
    id: '51',
    standardName: 'G_C1',
    aliases: ["c1","methane"]
  },
  {
    id: '52',
    standardName: 'G_C2',
    aliases: ["c2","ethane"]
  },
  {
    id: '53',
    standardName: 'G_C3',
    aliases: ["c3","propane"]
  },
  {
    id: '54',
    standardName: 'G_IC4',
    aliases: ["ic4","i butane","i-butane"]
  },
  {
    id: '55',
    standardName: 'G_IC5',
    aliases: ["ic5","i pentane","i-pentane"]
  },
  {
    id: '56',
    standardName: 'G_NC4',
    aliases: ["nc4","n butane","n-butane"]
  },
  {
    id: '57',
    standardName: 'G_NC5',
    aliases: ["nc5","n pentane","n-pentane"]
  },
  {
    id: '58',
    standardName: 'G_C6',
    aliases: ["c6","hexane"]
  },
  {
    id: '59',
    standardName: 'G_C7',
    aliases: ["c7","heptane"]
  },
  {
    id: '60',
    standardName: 'G_C8',
    aliases: ["c8","octane"]
  },
  {
    id: '61',
    standardName: 'G_C9',
    aliases: ["c9","nonane"]
  },
  {
    id: '62',
    standardName: 'G_H2S',
    aliases: ["h2s"]
  },
  {
    id: '63',
    standardName: 'G_H2SA',
    aliases: ["h2s average","h2s avg","h2sa"]
  },
  {
    id: '64',
    standardName: 'G_H2SX',
    aliases: ["h2s max","h2sx"]
  },
  {
    id: '65',
    standardName: 'G_H2SN',
    aliases: ["h2s min","h2sn"]
  },
  {
    id: '66',
    standardName: 'G_CO2',
    aliases: ["co2"]
  },
  {
    id: '67',
    standardName: 'G_CO2A',
    aliases: ["co2 average","co2 avg","co2a"]
  },
  {
    id: '68',
    standardName: 'G_CO2N',
    aliases: ["co2 min","co2n"]
  },
  {
    id: '69',
    standardName: 'G_CO2X',
    aliases: ["co2 max","co2x"]
  },
  {
    id: '70',
    standardName: 'TIME',
    aliases: ["time","date","ETIM","seconds since midnight"]
  }
];



// Export just the standard names for a dropdown
export const standardChannelNames: string[] = defaultChannels.map(
  (channel) => channel.standardName
);

export const ChannelBank = ({ onChannelBankUpdate }: ChannelBankProps) => {
  const [channels, setChannels] = useState<ChannelBankItem[]>(defaultChannels);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ standardName: '', aliases: '' });
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    onChannelBankUpdate?.(channels);
  }, [channels, onChannelBankUpdate]);

  const filteredChannels = channels.filter(channel =>
    channel.standardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    channel.aliases.some(alias => alias.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (channel: ChannelBankItem) => {
    setEditingId(channel.id);
    setEditForm({
      standardName: channel.standardName,
      aliases: channel.aliases.join(', ')
    });
  };

  const handleSave = (id: string) => {
    const aliases = editForm.aliases
      .split(',')
      .map(alias => alias.trim())
      .filter(alias => alias.length > 0);

    setChannels(prev => prev.map(channel =>
      channel.id === id
        ? { ...channel, standardName: editForm.standardName, aliases }
        : channel
    ));
    setEditingId(null);
    setEditForm({ standardName: '', aliases: '' });
  };

  const handleDelete = (id: string) => {
    setChannels(prev => prev.filter(channel => channel.id !== id));
  };

  const handleAddNew = () => {
    if (!editForm.standardName.trim()) return;

    const aliases = editForm.aliases
      .split(',')
      .map(alias => alias.trim())
      .filter(alias => alias.length > 0);

    const newChannel: ChannelBankItem = {
      id: Date.now().toString(),
      standardName: editForm.standardName.trim(),
      aliases
    };

    setChannels(prev => [...prev, newChannel]);
    setIsAddingNew(false);
    setEditForm({ standardName: '', aliases: '' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAddingNew(false);
    setEditForm({ standardName: '', aliases: '' });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Channel Bank Database
        </h2>
        <p className="text-muted-foreground">
          Manage standard channel names and their aliases for automatic matching
        </p>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search channels or aliases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Channel
        </Button>
      </div>

      <div className="bg-card border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-table-header text-white">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Standard Channel Name</th>
                <th className="px-4 py-3 text-left font-medium">Aliases</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isAddingNew && (
                <tr className="bg-primary/5">
                  <td className="px-4 py-3">
                    <Input
                      placeholder="Standard channel name"
                      value={editForm.standardName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, standardName: e.target.value }))}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      placeholder="Aliases (comma separated)"
                      value={editForm.aliases}
                      onChange={(e) => setEditForm(prev => ({ ...prev, aliases: e.target.value }))}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleAddNew}
                        className="flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        className="flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
              {filteredChannels.map((channel, index) => (
                <tr 
                  key={channel.id}
                  className={`${
                    index % 2 === 0 ? 'bg-background' : 'bg-table-row-even'
                  } hover:bg-table-row-hover transition-colors`}
                >
                  <td className="px-4 py-3">
                    {editingId === channel.id ? (
                      <Input
                        value={editForm.standardName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, standardName: e.target.value }))}
                      />
                    ) : (
                      <span className="font-medium text-primary">{channel.standardName}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === channel.id ? (
                      <Input
                        value={editForm.aliases}
                        onChange={(e) => setEditForm(prev => ({ ...prev, aliases: e.target.value }))}
                      />
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {channel.aliases.map((alias, aliasIndex) => (
                          <span
                            key={aliasIndex}
                            className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded"
                          >
                            {alias}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      {editingId === channel.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSave(channel.id)}
                            className="flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancel}
                            className="flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(channel)}
                            className="flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(channel.id)}
                            className="flex items-center gap-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredChannels.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No channels found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};