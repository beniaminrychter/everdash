export interface ServiceCommand {
  domain: 'light' | 'switch';
  service: 'turn_on' | 'turn_off';
  data: { entity_id: string; brightness_pct?: number; rgb_color?: number[] };
}

export interface ClimateCommand {
  domain: 'climate';
  data: {
    entity_id: `climate.${string}`;
    temperature?: number;
    hvac_mode?: string;
    fan_mode?: string;
  };
  service: 'set_temperature' | 'set_hvac_mode' | 'set_fan_mode';
}

export interface HomeAssistantApi {
  getState: (entityId: string) => Promise<unknown>;
  callService: (command: ServiceCommand) => Promise<void>;
  abort: () => void;
}

export interface ClimateApi extends Omit<HomeAssistantApi, 'callService'> {
  callService: (command: ClimateCommand) => Promise<void>;
}

export interface CatalogApi extends HomeAssistantApi {
  getStates: () => Promise<unknown>;
  getWeatherForecast: (entityId: string) => Promise<unknown>;
}
