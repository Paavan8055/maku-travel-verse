import { LatLngExpression, DivIcon, Icon } from 'leaflet';

declare module 'react-leaflet' {
  import { ComponentType } from 'react';
  
  interface MapContainerProps {
    center?: LatLngExpression;
    zoom?: number;
    style?: React.CSSProperties;
    scrollWheelZoom?: boolean;
    zoomControl?: boolean;
    children?: React.ReactNode;
  }
  
  interface MarkerProps {
    position: LatLngExpression;
    icon?: DivIcon | Icon;
    children?: React.ReactNode;
  }
  
  interface TileLayerProps {
    url: string;
    attribution?: string;
  }
  
  interface PopupProps {
    children?: React.ReactNode;
  }

  export const MapContainer: ComponentType<MapContainerProps>;
  export const TileLayer: ComponentType<TileLayerProps>;
  export const Marker: ComponentType<MarkerProps>;
  export const Popup: ComponentType<PopupProps>;
}