import React, { useState, useEffect } from 'react';

interface ElementType {
  id: string;
  type: string;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  isMultipleChoice?: boolean;
  children?: ElementType[];
}

interface FormPreviewProps {
  elements: ElementType[];
  onSubmit?: (data: Record<string, any>) => void;
  jsonSchema?: any;
}

export function FormPreview({ elements: propElements, onSubmit, jsonSchema }: FormPreviewProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submittedData, setSubmittedData] = useState<Record<string, any> | null>(null);
  const [showSubmission, setShowSubmission] = useState(false);
  const [elements, setElements] = useState<ElementType[]>(propElements);
  const [fieldLabels, setFieldLabels] = useState<Record<string, string>>({});
  const [fieldDescriptions, setFieldDescriptions] = useState<Record<string, string>>({});

  // Convert JSON schema to form elements if provided
  useEffect(() => {
    if (jsonSchema) {
      const { convertedElements, labels, descriptions } = convertJsonSchemaToElements(jsonSchema);
      setElements(convertedElements);
      setFieldLabels(labels);
      setFieldDescriptions(descriptions);

      // Initialize form data with default values from JSON schema
      const initialData: Record<string, any> = {};
      Object.entries(jsonSchema.properties || {}).forEach(([key, prop]: [string, any]) => {
        if (prop.default !== undefined) {
          initialData[key] = prop.default;
        }
      });
      setFormData(initialData);
    } else {
      setElements(propElements);

      // Extract descriptions from elements
      const descriptions: Record<string, string> = {};
      const extractDescriptions = (elements: ElementType[]) => {
        elements.forEach((element) => {
          if (element.description) {
            descriptions[element.id] = element.description;
          }
          if (element.children) {
            extractDescriptions(element.children);
          }
        });
      };
      extractDescriptions(propElements);
      setFieldDescriptions(descriptions);
    }
  }, [jsonSchema, propElements]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedData(formData);
    setShowSubmission(true);
    if (onSubmit) onSubmit(formData);
  };

  const handleChange = (id: string, value: any) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // Function to convert JSON schema to form elements and extract field labels and descriptions
  const convertJsonSchemaToElements = (
    schema: any
  ): { convertedElements: ElementType[]; labels: Record<string, string>; descriptions: Record<string, string> } => {
    const result: ElementType[] = [];
    const labels: Record<string, string> = {};
    const descriptions: Record<string, string> = {};

    if (schema.title) {
      result.push({
        id: 'title',
        type: 'title',
        label: schema.title,
        description: schema.description || '',
      });

      if (schema.description) {
        descriptions['title'] = schema.description;
      }
    }

    if (schema.properties) {
      Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
        const required = schema.required && schema.required.includes(key);

        // Store description if available
        if (prop.description) {
          descriptions[key] = prop.description;
        }

        switch (prop.type) {
          case 'string':
            if (prop.enum) {
              result.push({
                id: key,
                type: 'select',
                label: prop.title || key,
                description: prop.description,
                options: prop.enum,
                isMultipleChoice: false,
                required,
              });
            } else if (prop.format === 'email') {
              result.push({
                id: key,
                type: 'email',
                label: prop.title || key,
                description: prop.description,
                placeholder: prop.example || '',
                required,
              });
            } else {
              result.push({
                id: key,
                type: 'text',
                label: prop.title || key,
                description: prop.description,
                placeholder: prop.example || '',
                required,
              });
            }
            labels[key] = prop.title || key; // Store label
            break;
          case 'number':
          case 'integer':
            result.push({
              id: key,
              type: 'number',
              label: prop.title || key,
              description: prop.description,
              placeholder: prop.example || '',
              required,
            });
            labels[key] = prop.title || key; // Store label
            break;
          case 'boolean':
            result.push({
              id: key,
              type: 'checkbox',
              label: prop.title || key,
              description: prop.description,
              required,
            });
            labels[key] = prop.title || key; // Store label
            break;
          case 'array':
            if (prop.items && prop.items.enum) {
              result.push({
                id: key,
                type: 'select',
                label: prop.title || key,
                description: prop.description,
                options: prop.items.enum,
                isMultipleChoice: true,
                required,
              });
              labels[key] = prop.title || key; // Store label
            }
            break;
          case 'object':
            const childElements: ElementType[] = [];
            if (prop.properties) {
              Object.entries(prop.properties).forEach(([childKey, childProp]: [string, any]) => {
                const childRequired = prop.required && prop.required.includes(childKey);
                childElements.push({
                  id: `${key}_${childKey}`,
                  type: childProp.type === 'boolean' ? 'checkbox' : 'text',
                  label: childProp.title || childKey,
                  description: childProp.description,
                  placeholder: childProp.example || '',
                  required: childRequired,
                });
                labels[`${key}_${childKey}`] = childProp.title || childKey; // Store label

                // Store child description if available
                if (childProp.description) {
                  descriptions[`${key}_${childKey}`] = childProp.description;
                }
              });
            }
            result.push({
              id: key,
              type: 'section',
              label: prop.title || key,
              description: prop.description,
              children: childElements,
            });
            break;
          default:
            break;
        }
      });
    }
    return { convertedElements: result, labels, descriptions };
  };

  const renderElement = (element: ElementType) => {
    switch (element.type) {
      case 'title':
        return (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">{element.label}</h2>
            {element.description && <p className="mt-2 text-gray-600">{element.description}</p>}
          </div>
        );
      case 'section':
        return (
          <div className="bg-gray-50/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">{element.label}</h3>
              {element.description && <p className="mt-2 text-gray-600 text-sm">{element.description}</p>}
            </div>
            <div className="space-y-4">
              {element.children?.map((child) => (
                <div key={child.id}>{renderElement(child)}</div>
              ))}
            </div>
          </div>
        );
      case 'text':
      case 'email':
      case 'number':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {element.description && <p className="text-xs text-gray-500">{element.description}</p>}
            <input
              type={element.type}
              value={formData[element.id] || ''}
              onChange={(e) => handleChange(element.id, e.target.value)}
              placeholder={element.placeholder}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required={element.required}
            />
          </div>
        );
      case 'select':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {element.label}
              {element.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {element.description && <p className="text-xs text-gray-500">{element.description}</p>}
            {element.isMultipleChoice ? (
              <div className="space-y-2">
                {element.options?.map((option, index) => (
                  <label key={index} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={option}
                      checked={Array.isArray(formData[element.id]) && formData[element.id].includes(option)}
                      onChange={(e) => {
                        const currentValue = formData[element.id] || [];
                        const newValue = e.target.checked
                          ? [...currentValue, option]
                          : currentValue.filter((v: string) => v !== option);
                        handleChange(element.id, newValue);
                      }}
                      className="rounded text-indigo-500 focus:ring-indigo-500"
                      required={element.required && index === 0}
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <select
                value={formData[element.id] || ''}
                onChange={(e) => handleChange(element.id, e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required={element.required}
              >
                <option value="">Select an option</option>
                {element.options?.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      case 'checkbox':
        return (
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData[element.id] || false}
                onChange={(e) => handleChange(element.id, e.target.checked)}
                className="rounded text-indigo-500 focus:ring-indigo-500"
                required={element.required}
              />
              <span className="text-sm text-gray-700">
                {element.label}
                {element.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </label>
            {element.description && <p className="text-xs text-gray-500 ml-6">{element.description}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  if (elements.length === 0) {
    return (
      <div className="bg-white/50 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-gray-200/50 text-center text-gray-500">
        No form elements added yet. Exit preview mode to build your form.
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="bg-white/50 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-gray-200/50">
        <div className="space-y-6">
          {elements.map((element) => (
            <div key={element.id}>{renderElement(element)}</div>
          ))}
        </div>
        <div className="mt-8">
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Submit Form
          </button>
        </div>
      </form>

      {/* Display submitted data in a user-friendly way */}
      {showSubmission && submittedData && (
        <div className="mt-8 p-6 bg-green-50/50 backdrop-blur-sm border border-green-200/50 rounded-2xl animate-fade-in">
          <h3 className="text-lg font-semibold text-green-800 mb-4">Form Submitted Successfully</h3>
          <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-green-100/50">
            {elements.map((element) => {
              if (element.type === 'section' || element.type === 'title') {
                return (
                  <div key={element.id} className="mb-6">
                    <h4 className="text-xl font-semibold text-gray-800 mb-1">{element.label}</h4>
                    {element.description && <p className="text-sm text-gray-600 mb-4">{element.description}</p>}
                    <div className="space-y-4">
                      {element.children?.map((child) => (
                        <div key={child.id} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {fieldLabels[child.id] || child.label}
                          </label>
                          {fieldDescriptions[child.id] && (
                            <p className="text-xs text-gray-500">{fieldDescriptions[child.id]}</p>
                          )}
                          <div className="text-gray-900">
                            {Array.isArray(submittedData[child.id])
                              ? submittedData[child.id].join(', ')
                              : submittedData[child.id]?.toString() || 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } else if (element.type !== 'title') {
                return (
                  <div key={element.id} className="space-y-2 mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      {fieldLabels[element.id] || element.label}
                    </label>
                    {fieldDescriptions[element.id] && (
                      <p className="text-xs text-gray-500">{fieldDescriptions[element.id]}</p>
                    )}
                    <div className="text-gray-900">
                      {Array.isArray(submittedData[element.id])
                        ? submittedData[element.id].join(', ')
                        : submittedData[element.id]?.toString() || 'N/A'}
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}