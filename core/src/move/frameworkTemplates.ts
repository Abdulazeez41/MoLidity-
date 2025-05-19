export const FRAMEWORK_TEMPLATES: Record<
  string,
  {
    initFn: string;
    imports: string[];
    tableNew: string;
  }
> = {
  sui: {
    initFn: `fun init(ctx: &mut TxContext)`,
    imports: ["use sui::object", "use sui::transfer", "use sui::tx_context"],
    tableNew: "table::new<_, _>(ctx)",
  },
  aptos: {
    initFn: `fun init(ctx: &mut TxContext)`,
    imports: ["use aptos_std::table"],
    tableNew: "table::new<_, _>()",
  },
};
