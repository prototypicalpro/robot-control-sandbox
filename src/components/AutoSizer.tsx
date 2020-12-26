import * as React from 'react';

type WidthHeight = {
  width: number;
  height: number;
};

export default function AutoSizer({
  children,
  style,
  className
}: {
  children: (size: WidthHeight) => React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const [widthHeight, setWidthHeight] = React.useState<WidthHeight>();
  const elemRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (elemRef.current) {
      const size = elemRef.current.getBoundingClientRect();
      setWidthHeight({width: size.width, height: size.height});
    }
  }, [setWidthHeight]);

  return (
    <div
      ref={elemRef}
      style={{width: '100%', height: '100%', ...style}}
      className={className}
    >
      {widthHeight ? children(widthHeight) : null}
    </div>
  );
}
