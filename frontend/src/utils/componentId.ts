/**
 * Sistema de identificação de componentes para debugging
 * Convenção: omnix-{tipo}-{nome}-{elemento?}
 */

export const createComponentId = (componentName: string, element?: string): string => {
  const baseId = `omnix-${componentName.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '')}`;
  return element ? `${baseId}-${element.toLowerCase()}` : baseId;
};

export const createPageId = (pageName: string): string => {
  return `omnix-page-${pageName.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '')}`;
};

export const createLayoutId = (layoutName: string, element?: string): string => {
  const baseId = `omnix-layout-${layoutName.toLowerCase()}`;
  return element ? `${baseId}-${element}` : baseId;
};

export const createFeatureId = (featureName: string, element?: string): string => {
  const baseId = `omnix-feature-${featureName.toLowerCase().replace(/\s+/g, '-')}`;
  return element ? `${baseId}-${element}` : baseId;
};

/**
 * Classes de debugging para desenvolvimento
 */
export const debugClasses = process.env.NODE_ENV === 'development' ? {
  component: 'data-component',
  feature: 'data-feature', 
  layout: 'data-layout',
  page: 'data-page'
} : {};

/**
 * Helper para adicionar classes de identificação
 */
export const withComponentId = (componentName: string, element?: string) => ({
  className: createComponentId(componentName, element),
  'data-component': componentName,
  'data-element': element || 'root'
});

export const withPageId = (pageName: string) => ({
  className: createPageId(pageName),
  'data-page': pageName,
  'data-type': 'page'
});

export const withLayoutId = (layoutName: string, element?: string) => ({
  className: createLayoutId(layoutName, element),
  'data-layout': layoutName,
  'data-element': element || 'root'
});

export const withFeatureId = (featureName: string, element?: string) => ({
  className: createFeatureId(featureName, element),
  'data-feature': featureName,
  'data-element': element || 'root'
});