
import { useDraggable } from '@dnd-kit/core';
import { Type, ListChecks, LayoutDashboard, Mail, Hash, CheckSquare, FolderTree } from 'lucide-react';

const tools = [
  { id: 'title', icon: LayoutDashboard, label: 'Title' },
  { id: 'section', icon: FolderTree, label: 'Section' },
  { id: 'text', icon: Type, label: 'Text Input' },
  { id: 'email', icon: Mail, label: 'Email Input' },
  { id: 'number', icon: Hash, label: 'Number Input' },
  { id: 'select', icon: ListChecks, label: 'Select Box' },
  { id: 'checkbox', icon: CheckSquare, label: 'Checkbox' },
];

function DraggableTool({ id, icon: Icon, label }: { id: string; icon: any; label: string }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-all hover:border-indigo-200 group"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-indigo-500 group-hover:text-indigo-600" />
        <span className="text-gray-700 group-hover:text-gray-900">{label}</span>
      </div>
    </div>
  );
}

export function Toolbox() {
  return (
    <div className="w-72 bg-white p-6 rounded-xl shadow-sm border border-gray-200 ">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Form Elements</h2>
      <div className="space-y-3">
        {tools.map((tool) => (
          <DraggableTool key={tool.id} {...tool} />
        ))}
      </div>
    </div>
  );
}