import { ReactNode } from 'react';

type ListPanelProps = {
  children: ReactNode;
  footer?: ReactNode;
};

/** Table/list container with consistent padding and optional footer (pagination). */
export function ListPanel({ children, footer }: ListPanelProps) {
  return (
    <div className="list-panel">
      <div className="list-panel-body">{children}</div>
      {footer ? <div className="list-panel-footer">{footer}</div> : null}
    </div>
  );
}
