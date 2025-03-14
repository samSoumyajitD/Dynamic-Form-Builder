import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, GripVertical, X } from 'lucide-react';
import type { ElementType } from './FormBuilder';

interface FormElementProps {
  element: ElementType;
  onUpdate?: (id: string, updates: Partial<ElementType>) => void;
  onRemove?: (id: string) => void;
  children?: React.ReactNode;
}

export function FormElement({ element, onUpdate, onRemove, children }: FormElementProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  const handleLabelChange = (newLabel: string) => {
    onUpdate?.(element.id, { label: newLabel });
  };

  const handleDescriptionChange = (newDescription: string) => {
    onUpdate?.(element.id, { description: newDescription });
  };

  const handlePlaceholderChange = (newPlaceholder: string) => {
    onUpdate?.(element.id, { placeholder: newPlaceholder });
  };

  const handleRequiredChange = (required: boolean) => {
    onUpdate?.(element.id, { required });
  };

  const handleOptionChange = (index: number, value: string) => {
    if (!element.options) return;
    const newOptions = [...element.options];
    newOptions[index] = value;
    onUpdate?.(element.id, { options: newOptions });
  };

  const addOption = () => {
    if (!element.options) return;
    if (element.maxOptions && element.options.length >= element.maxOptions) return;
    onUpdate?.(element.id, { 
      options: [...element.options, `Option ${element.options.length + 1}`] 
    });
  };

  const removeOption = (index: number) => {
    if (!element.options || element.options.length <= 2) return;
    const newOptions = element.options.filter((_, i) => i !== index);
    onUpdate?.(element.id, { options: newOptions });
  };

  const toggleMultipleChoice = () => {
    onUpdate?.(element.id, { isMultipleChoice: !element.isMultipleChoice });
  };

  const handleMaxOptionsChange = (value: string) => {
    const maxOptions = parseInt(value, 10);
    if (isNaN(maxOptions) || maxOptions < 2) return;
    onUpdate?.(element.id, { maxOptions });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white p-6 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all relative ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          {...attributes}
          {...listeners}
          className="mt-2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-5 h-5 text-gray-400 hover:text-gray-600" />
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <input
              type="text"
              value={element.label}
              onChange={(e) => handleLabelChange(e.target.value)}
              className="text-lg font-semibold focus:outline-none focus:border-b-2 focus:border-indigo-500 transition-colors placeholder-gray-400"
              placeholder={`Enter ${element.type} label`}
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={element.required}
                  onChange={(e) => handleRequiredChange(e.target.checked)}
                  className="rounded text-indigo-500 focus:ring-indigo-500"
                />
                Required
              </label>
              <button
                onClick={() => onRemove?.(element.id)}
                className="p-1 text-gray-400 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Remove element"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Description field for title and section elements */}
          {(element.type === 'title' || element.type === 'section') && (
            <textarea
              value={element.description || ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-600 min-h-20 placeholder-gray-400"
              placeholder={`Enter ${element.type} description (optional)`}
            />
          )}

          {(element.type === 'text' || element.type === 'email' || element.type === 'number') && (
            <input
              type="text"
              value={element.placeholder || ''}
              onChange={(e) => handlePlaceholderChange(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
              placeholder="Enter placeholder text"
            />
          )}

          {element.type === 'checkbox' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                disabled
                className="rounded text-indigo-500"
              />
              <span className="text-gray-600">Checkbox preview</span>
            </div>
          )}
          
          {element.type === 'select' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={element.isMultipleChoice}
                    onChange={toggleMultipleChoice}
                    className="rounded text-indigo-500"
                  />
                  <span className="text-sm text-gray-600">Multiple Choice</span>
                </label>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Max Options:</label>
                  <input
                    type="number"
                    min="2"
                    value={element.maxOptions}
                    onChange={(e) => handleMaxOptionsChange(e.target.value)}
                    className="w-16 p-1 text-sm border rounded focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {element.options?.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
                      placeholder={`Option ${index + 1}`}
                    />
                    {element.options && element.options.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {(!element.maxOptions || (element.options && element.options.length < element.maxOptions)) && (
                <button
                  onClick={addOption}
                  className="flex items-center gap-1 text-sm text-indigo-500 hover:text-indigo-600"
                >
                  <Plus className="w-4 h-4" /> Add Option
                </button>
              )}
            </div>
          )}

          {element.type === 'section' && (
            <div className="border-l-2 border-indigo-200 pl-4 mt-2">
              {children || (
                <p className="text-sm text-gray-500 italic">
                  Drag form elements here to create a nested section
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}