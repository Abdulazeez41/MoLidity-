export interface MoveStruct {
    name: string;
    fields: {
        name: string;
        type: string;
    }[];
}
/**
 * Maps Solidity types to Move types with support for tuples, arrays, and mappings.
 */
export declare function mapSolidityTypeToMove(type: string, components?: {
    name: string;
    type: string;
    components?: any[];
}[], contextName?: string, customTypes?: Record<string, string>): {
    moveType: string;
    structs: MoveStruct[];
};
/**
 * Public utility to get Move type string directly
 */
export declare function getMoveTypeString(type: string, components?: {
    name: string;
    type: string;
    components?: any[];
}[], customTypes?: Record<string, string>): string;
/**
 * Converts a MoveStruct to Move language syntax.
 */
export declare function renderMoveStruct(struct: MoveStruct): string;
