import type { ElementType } from '../components/FormBuilder';

interface JsonSchema {
  type: string;
  properties: Record<string, any>;
  required?: string[];
  title?: string;
  description?: string;
}

export function elementsToJsonSchema(elements: ElementType[]): JsonSchema {
  if (!elements || elements.length === 0) {
    return {
      type: 'object',
      properties: {},
      required: undefined,
    };
  }

  const properties: Record<string, any> = {};
  const required: string[] = [];

  elements.forEach((element) => {
    if (element.type === 'section' && element.children) {
      // Recursively handle section elements
      const { properties: childProps, required: childRequired } = elementsToJsonSchema(element.children);
      properties[element.id] = {
        type: 'object',
        title: element.label,
        description: element.description,
        properties: childProps,
        ...(childRequired && childRequired.length > 0 ? { required: childRequired } : {}),
      };
      if (element.required) {
        required.push(element.id);
      }
    } else {
      let schema: any = {
        title: element.label,
        description: element.description,
      };

      switch (element.type) {
        case 'text':
          schema.type = 'string';
          if (element.placeholder) {
            schema.examples = [element.placeholder];
          }
          break;
        case 'email':
          schema.type = 'string';
          schema.format = 'email';
          if (element.placeholder) {
            schema.examples = [element.placeholder];
          }
          break;
        case 'number':
          schema.type = 'number';
          if (element.placeholder) {
            schema.examples = [element.placeholder];
          }
          break;
        case 'checkbox':
          schema.type = 'boolean';
          break;
        case 'select':
          if (element.isMultipleChoice) {
            schema.type = 'array';
            schema.items = {
              type: 'string',
              enum: element.options || [],
            };
            if (element.maxOptions) {
              schema.maxItems = element.maxOptions;
            }
          } else {
            schema.type = 'string';
            schema.enum = element.options || [];
          }
          break;
        case 'title':
          schema.type = 'string';
          schema.readOnly = true; // Make title fields read-only
          schema.description = element.description;
          break;
        default:
          // Handle unknown types (optional)
          schema.type = 'string';
          break;
      }

      if (element.required) {
        required.push(element.id);
      }

      properties[element.id] = schema;
    }
  });

  return {
    type: 'object',
    properties,
    required: required.length > 0 ? required : undefined,
  };
}