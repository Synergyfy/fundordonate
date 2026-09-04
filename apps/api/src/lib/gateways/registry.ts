import type { GatewayConfig, GatewayId, IPaymentGateway } from "./types";
import { logger } from "../logger";

// =============================================================================
// Gateway Registry
// Discovery and registration system for payment gateways
// =============================================================================

class GatewayRegistry {
  private gateways: Map<GatewayId, IPaymentGateway> = new Map();
  private initialized = false;

  /**
   * Register a payment gateway
   */
  register(gateway: IPaymentGateway): void {
    this.gateways.set(gateway.id, gateway);
    logger.info(`[GatewayRegistry] Registered gateway: ${gateway.name} (${gateway.id})`);
  }

  /**
   * Get a gateway by ID
   */
  get(id: GatewayId): IPaymentGateway | undefined {
    return this.gateways.get(id);
  }

  /**
   * Get all registered gateways
   */
  getAll(): IPaymentGateway[] {
    return Array.from(this.gateways.values());
  }

  /**
   * Get all enabled and configured gateways
   */
  async getAvailable(): Promise<IPaymentGateway[]> {
    const available: IPaymentGateway[] = [];
    for (const gateway of this.gateways.values()) {
      try {
        if (await gateway.isConfigured()) {
          available.push(gateway);
        }
      } catch (error) {
        logger.error(`[GatewayRegistry] Error checking gateway ${gateway.id}`, { error: String(error) });
      }
    }
    return available;
  }

  /**
   * Get gateway configurations for frontend
   */
  async getAvailableConfigs(): Promise<GatewayConfig[]> {
    const gateways = await this.getAvailable();
    const configs: GatewayConfig[] = [];
    for (const gateway of gateways) {
      try {
        const config = await gateway.getConfig();
        configs.push(config);
      } catch (error) {
        logger.error(`[GatewayRegistry] Error getting config for ${gateway.id}`, { error: String(error) });
      }
    }
    return configs;
  }

  /**
   * Find gateway that supports a given payment method
   */
  async findByPaymentMethod(method: string): Promise<IPaymentGateway | undefined> {
    for (const gateway of this.gateways.values()) {
      const methods = gateway.getPaymentMethods();
      if (methods.includes(method)) {
        const configured = await gateway.isConfigured();
        if (configured) return gateway;
      }
    }
    return undefined;
  }

  /**
   * Get default gateway (first available)
   */
  async getDefault(): Promise<IPaymentGateway | undefined> {
    const available = await this.getAvailable();
    return available[0];
  }

  /**
   * Initialize all gateways from environment config
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const gatewayIds: GatewayId[] = ["stripe", "paypal", "native"];
    for (const id of gatewayIds) {
      try {
        const GatewayClass = await this.loadGateway(id);
        if (GatewayClass) {
          const gateway = new GatewayClass();
          this.register(gateway);
        }
      } catch (error) {
        logger.error(`[GatewayRegistry] Failed to load gateway ${id}`, { error: String(error) });
      }
    }

    this.initialized = true;
    logger.info(`[GatewayRegistry] Initialized with ${this.gateways.size} gateways`);
  }

  /**
   * Dynamically load gateway class
   */
  private async loadGateway(id: GatewayId): Promise<{ new (): IPaymentGateway } | null> {
    switch (id) {
      case "stripe":
        try {
          const mod = await import("./stripe.gateway");
          return mod.StripeGateway;
        } catch {
          return null;
        }
      case "paypal":
        try {
          const mod = await import("./paypal.gateway");
          return mod.PayPalGateway;
        } catch {
          return null;
        }
      case "native":
        try {
          const mod = await import("./native.gateway");
          return mod.NativeGateway;
        } catch {
          return null;
        }
      default:
        return null;
    }
  }
}

// Singleton
export const gatewayRegistry = new GatewayRegistry();
