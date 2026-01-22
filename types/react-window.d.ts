declare module 'react-window' {
  import { Component, CSSProperties } from 'react';

  export interface ListChildComponentProps {
    index: number;
    style: CSSProperties;
    data: any;
  }

  export interface FixedSizeListProps {
    children: (props: ListChildComponentProps) => React.ReactElement | null;
    className?: string;
    height: number | string;
    initialScrollOffset?: number;
    innerRef?: React.Ref<any>;
    innerElementType?: React.ElementType;
    itemCount: number;
    itemData?: any;
    itemKey?: (index: number, data: any) => any;
    layout?: 'horizontal' | 'vertical';
    onItemsRendered?: (props: {
      overscanStartIndex: number;
      overscanStopIndex: number;
      visibleStartIndex: number;
      visibleStopIndex: number;
    }) => void;
    onScroll?: (props: {
      scrollDirection: 'forward' | 'backward';
      scrollOffset: number;
      scrollUpdateWasRequested: boolean;
    }) => void;
    outerRef?: React.Ref<any>;
    outerElementType?: React.ElementType;
    overscanCount?: number;
    style?: CSSProperties;
    useIsScrolling?: boolean;
    width: number | string;
    itemSize: number;
  }

  export class FixedSizeList extends Component<FixedSizeListProps> {}
}
