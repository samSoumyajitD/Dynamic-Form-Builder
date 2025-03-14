import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Toolbox } from './Toolbox';
import { FormCanvas } from './FormCanvas';
import { FormPreview } from './FormPreview';
import { Eye, EyeOff, Code, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { elementsToJsonSchema } from '../utils/schemaConverter';
import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });

export type ElementType = {
  id: string;
  type: 'text' | 'email' | 'number' | 'select' | 'checkbox' | 'section' | 'title';
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  isMultipleChoice?: boolean;
  maxOptions?: number;
  children?: ElementType[];
};

export function FormBuilder() {
  const [elements, setElements] = useState<ElementType[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [isToolboxMinimized, setIsToolboxMinimized] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const findElementAndParent = (elements: ElementType[], id: string): { element: ElementType | null; parent: ElementType[] | null } => {
    for (const element of elements) {
      if (element.id === id) {
        return { element, parent: elements };
      }
      if (element.children) {
        const result = findElementAndParent(element.children, id);
        if (result.element) {
          return result;
        }
      }
    }
    return { element: null, parent: null };
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
  
    const findSection = (elements: ElementType[], overId: string): ElementType | null => {
      for (const element of elements) {
        if (element.id === overId && element.type === 'section') {
          return element;
        }
        if (element.children) {
          const found = findSection(element.children, overId);
          if (found) return found;
        }
      }
      return null;
    };
  
    const targetSection = findSection(elements, over.id as string);
    const { element: activeElement, parent: activeParent } = findElementAndParent(elements, active.id as string);
    const { element: overElement, parent: overParent } = findElementAndParent(elements, over.id as string);
  
    if (!activeElement && !targetSection) {
      const newElement: ElementType = {
        id: `${active.id}-${Date.now()}`,
        type: active.id as ElementType['type'],
        label: `New ${active.id}`,
        required: false,
        placeholder: '',
        description: (active.id === 'title' || active.id === 'section') ? '' : undefined,
        ...(active.id === 'select' ? {
          options: ['Option 1', 'Option 2'],
          isMultipleChoice: false,
          maxOptions: 4
        } : {}),
        ...(active.id === 'section' ? {
          children: []
        } : {}),
      };
  
      if (overElement?.type === 'section') {
        setElements(elements.map(element => 
          element.id === overElement.id 
            ? { ...element, children: [...(element.children || []), newElement] }
            : element
        ));
      } else {
        setElements([...elements, newElement]);
      }
    } else if (activeElement && overElement) {
      if (targetSection && targetSection.id === over.id) {
        if (activeParent) {
          const newActiveParent = activeParent.filter(e => e.id !== active.id);
          
          const updateElements = (elements: ElementType[]): ElementType[] => {
            return elements.map(element => {
              if (element.id === targetSection.id) {
                return {
                  ...element,
                  children: [...(element.children || []), activeElement]
                };
              }
              if (element.children) {
                return {
                  ...element,
                  children: updateElements(element.children)
                };
              }
              return element;
            });
          };
  
          if (activeParent === elements) {
            setElements(updateElements(newActiveParent));
          } else {
            setElements(updateElements(elements));
          }
        }
      } else if (activeParent && overParent && activeParent === overParent) {
        const activeIndex = activeParent.indexOf(activeElement);
        const overIndex = activeParent.indexOf(overElement);
  
        if (activeParent === elements) {
          setElements(arrayMove(elements, activeIndex, overIndex));
        } else {
          const updateElements = (elements: ElementType[]): ElementType[] => {
            return elements.map(element => {
              if (element.children === activeParent) {
                return {
                  ...element,
                  children: arrayMove(element.children, activeIndex, overIndex)
                };
              }
              if (element.children) {
                return {
                  ...element,
                  children: updateElements(element.children)
                };
              }
              return element;
            });
          };
          setElements(updateElements(elements));
        }
      }
    }
    
    setActiveId(null);
  };

  const handleElementUpdate = (id: string, updates: Partial<ElementType>) => {
    const updateElement = (elements: ElementType[]): ElementType[] => {
      return elements.map(element => {
        if (element.id === id) {
          return { ...element, ...updates };
        }
        if (element.children) {
          return {
            ...element,
            children: updateElement(element.children)
          };
        }
        return element;
      });
    };

    setElements(updateElement(elements));
  };

  const handleElementRemove = (id: string) => {
    const removeElement = (elements: ElementType[]): ElementType[] => {
      return elements.filter(element => {
        if (element.id === id) {
          return false;
        }
        if (element.children) {
          element.children = removeElement(element.children);
        }
        return true;
      });
    };

    setElements(removeElement(elements));
  };

  const handleSubmit = (formData: Record<string, any>) => {
    const schema = {
      type: 'object',
      properties: elementsToJsonSchema(elements)
    };

    const validate = ajv.compile(schema);
    const isValid = validate(formData);

    if (!isValid) {
      console.error('Validation errors:', validate.errors);
      alert('Form validation failed! Check console for details.');
      return;
    }

    console.log('Form submitted:', formData);
    console.log('JSON Schema:', schema);
    alert('Form submitted successfully! Check console for the data and schema.');
  };

  const jsonSchema = {
    type: 'object',
    properties: elementsToJsonSchema(elements)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Form Builder</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowSchema(!showSchema)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
            >
              <Code className="w-5 h-5" />
              {showSchema ? 'Hide Schema' : 'Show Schema'}
            </button>
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              {isPreview ? (
                <>
                  <EyeOff className="w-5 h-5" />
                  Exit Preview
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  Preview Form
                </>
              )}
            </button>
          </div>
        </div>
        
        {showSchema && (
          <div className="mb-8 bg-gray-900 rounded-lg p-6 text-white">
            <pre className="overflow-auto">
              {JSON.stringify(jsonSchema, null, 2)}
            </pre>
          </div>
        )}
        
        {isPreview ? (
          <FormPreview elements={elements} onSubmit={handleSubmit} />
        ) : (
          <div className="flex gap-8 relative">
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="sticky top-8 flex h-fit">
                {!isToolboxMinimized ? (
                  <div className="flex">
                    <Toolbox />
                    <button 
                      onClick={() => setIsToolboxMinimized(true)}
                      className="h-full flex items-center px-2 bg-gray-200 hover:bg-gray-300 rounded-r-lg"
                      title="Minimize toolbox"
                    >
                      <ChevronsLeft className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsToolboxMinimized(false)}
                    className="flex items-center justify-center w-10 h-32 bg-gray-200 hover:bg-gray-300 rounded-r-lg"
                    title="Expand toolbox"
                  >
                    <ChevronsRight className="w-5 h-5" />
                  </button>
                )}
              </div>
              <FormCanvas 
                elements={elements} 
                onElementUpdate={handleElementUpdate}
                onElementRemove={handleElementRemove}
              />
              <DragOverlay>
                {activeId ? (
                  <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-indigo-500">
                    {activeId}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  );
}