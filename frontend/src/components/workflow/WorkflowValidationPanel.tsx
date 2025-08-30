import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { ValidationResult } from '../../utils/workflowValidation';

interface WorkflowValidationPanelProps {
  validation: ValidationResult;
  className?: string;
}

export default function WorkflowValidationPanel({ 
  validation, 
  className = '' 
}: WorkflowValidationPanelProps) {
  const hasIssues = validation.errors.length > 0 || validation.warnings.length > 0;

  if (!hasIssues && validation.isValid) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            Workflow válido e pronto para uso
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Errors */}
      {validation.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-red-800 mb-1">
                Erros encontrados ({validation.errors.length})
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-red-500 font-bold">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-yellow-800 mb-1">
                Avisos ({validation.warnings.length})
              </div>
              <ul className="text-sm text-yellow-700 space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-yellow-500 font-bold">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}