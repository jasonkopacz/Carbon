declare module "react-simple-maps" {
  import type { ComponentProps, CSSProperties, MouseEvent, ReactNode } from "react";

  export interface ProjectionConfig {
    scale?: number;
    center?: [number, number];
    rotate?: [number, number, number];
  }

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: ProjectionConfig;
    width?: number;
    height?: number;
    style?: CSSProperties;
    className?: string;
    children?: ReactNode;
  }
  export const ComposableMap: (props: ComposableMapProps) => JSX.Element;

  export interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    translateExtent?: [[number, number], [number, number]];
    onMoveStart?: (pos: { coordinates: [number, number]; zoom: number }) => void;
    onMove?: (pos: { x: number; y: number; zoom: number; dragging: boolean }) => void;
    onMoveEnd?: (pos: { coordinates: [number, number]; zoom: number }) => void;
    // Return false to suppress an event (e.g. block wheel scroll zoom)
    filterZoomEvent?: (event: Event) => boolean;
    children?: ReactNode;
  }
  export const ZoomableGroup: (props: ZoomableGroupProps) => JSX.Element;

  export interface Geography {
    rsmKey: string;
    properties: Record<string, unknown>;
    geometry: unknown;
  }

  export interface GeographiesChildrenProps {
    geographies: Geography[];
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (props: GeographiesChildrenProps) => ReactNode;
  }
  export const Geographies: (props: GeographiesProps) => JSX.Element;

  export interface GeographyProps {
    geography: Geography;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: CSSProperties;
      hover?: CSSProperties;
      pressed?: CSSProperties;
    };
    onClick?: (e: MouseEvent<SVGPathElement>) => void;
    onMouseEnter?: (e: MouseEvent<SVGPathElement>) => void;
    onMouseLeave?: (e: MouseEvent<SVGPathElement>) => void;
    className?: string;
  }
  export const Geography: (props: GeographyProps) => JSX.Element;

  export interface MarkerProps {
    coordinates: [number, number];
    children?: ReactNode;
    onClick?: (e: MouseEvent<SVGGElement>) => void;
    onMouseEnter?: (e: MouseEvent<SVGGElement>) => void;
    onMouseMove?: (e: MouseEvent<SVGGElement>) => void;
    onMouseLeave?: (e: MouseEvent<SVGGElement>) => void;
    style?: CSSProperties;
    className?: string;
  }
  export const Marker: (props: MarkerProps) => JSX.Element;

  export const Graticule: (props: {
    step?: [number, number];
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
  }) => JSX.Element;

  export const Sphere: (props: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    id?: string;
  }) => JSX.Element;
}
