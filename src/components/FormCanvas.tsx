import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FormElement } from './FormElement';
import type { ElementType } from './FormBuilder';

interface FormCanvasProps {
  elements: ElementType[];
  onElementUpdate?: (id: string, updates: Partial<ElementType>) => void;
  onElementRemove?: (id: string) => void;
}

export function FormCanvas({ elements, onElementUpdate, onElementRemove }: FormCanvasProps) {
  const { setNodeRef } = useDroppable({
    id: 'canvas',
  });

  const renderElements = (elements: ElementType[]) => (
    <SortableContext items={elements.map(e => e.id)} strategy={verticalListSortingStrategy}>
      <div className="space-y-4 ">
        {elements.map((element) => (
          <FormElement 
            key={element.id} 
            element={element}
            onUpdate={onElementUpdate}
            onRemove={onElementRemove}
         
          >
            {element.type === 'section' && element.children && (
              <div 
                className="mt-4 pl-6 border-l-2 border-indigo-200 min-h-[100px]"
              >
                <div
                  className={`rounded-lg transition-colors ${element.children.length === 0 ? 'bg-gray-50/50' : ''}`}
                >
                  {renderElements(element.children)}
                </div>
              </div>
            )}
          </FormElement>
        ))}
      </div>
    </SortableContext>
  );

  return (
    <div
      ref={setNodeRef}
      className="flex-1 bg-white p-6 rounded-lg shadow-sm min-h-[600px] border border-gray-200"
    >
      {elements.length === 0 ? (
        <div className="h-full flex items-center justify-center text-gray-400">
          Drag and drop elements here
        </div>
      ) : (
        renderElements(elements)
      )}
    </div>
  );
}