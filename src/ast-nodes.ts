import type { Token, TokenLiteral } from "./token-types";

// AST node types
export type Expr =
  | BinaryExpr
  | GroupingExpr
  | LiteralExpr
  | UnaryExpr
  | VariableExpr
  | AssignExpr
  | LogicalExpr
  | CallExpr
  | GetExpr
  | SetExpr
  | ThisExpr
  | SuperExpr
  | NewExpr
  | ArrayExpr
  | ObjectExpr
  | IndexExpr
  | IndexAssignExpr
  | TemplateStringExpr
  | FunctionExpr;

export type Stmt =
  | ExpressionStmt
  | VarStmt
  | BlockStmt
  | IfStmt
  | WhileStmt
  | ForStmt
  | FunctionStmt
  | ReturnStmt
  | ClassStmt
  | ExportStmt;

// Expression types
export interface BinaryExpr {
  type: "BinaryExpr";
  left: Expr;
  operator: Token;
  right: Expr;
}

export interface GroupingExpr {
  type: "GroupingExpr";
  expression: Expr;
}

export interface LiteralExpr {
  type: "LiteralExpr";
  value: TokenLiteral;
}

export interface UnaryExpr {
  type: "UnaryExpr";
  operator: Token;
  right: Expr;
}

export interface VariableExpr {
  type: "VariableExpr";
  name: Token;
}

export interface AssignExpr {
  type: "AssignExpr";
  name: Token;
  value: Expr;
}

export interface LogicalExpr {
  type: "LogicalExpr";
  left: Expr;
  operator: Token;
  right: Expr;
}

export interface CallExpr {
  type: "CallExpr";
  callee: Expr;
  paren: Token;
  args: Expr[];
}

export interface GetExpr {
  type: "GetExpr";
  object: Expr;
  name: Token;
}

export interface SetExpr {
  type: "SetExpr";
  object: Expr;
  name: Token;
  value: Expr;
}

export interface ThisExpr {
  type: "ThisExpr";
  keyword: Token;
}

export interface SuperExpr {
  type: "SuperExpr";
  keyword: Token;
  method: Token;
}

export interface NewExpr {
  type: "NewExpr";
  className: Token;
  args: Expr[];
}

export interface ArrayExpr {
  type: "ArrayExpr";
  elements: Expr[];
}

export interface ObjectExpr {
  type: "ObjectExpr";
  properties: Map<string, Expr>;
}

export interface IndexExpr {
  type: "IndexExpr";
  object: Expr;
  index: Expr;
  bracket: Token;
}

export interface IndexAssignExpr {
  type: "IndexAssignExpr";
  object: Expr;
  index: Expr;
  value: Expr;
}

export interface TemplateStringExpr {
  type: "TemplateStringExpr";
  parts: (string | { expr: Expr })[];
}

export interface FunctionExpr {
  type: "FunctionExpr";
  name: Token | null;
  params: Token[];
  defaults: (Expr | null)[];
  body: Stmt[];
  restParam: Token | null;
}

// Statement types
export interface ExpressionStmt {
  type: "ExpressionStmt";
  expression: Expr;
}

export interface VarStmt {
  type: "VarStmt";
  name: Token;
  initializer: Expr | null;
  isConst: boolean;
}

export interface BlockStmt {
  type: "BlockStmt";
  statements: Stmt[];
}

export interface IfStmt {
  type: "IfStmt";
  condition: Expr;
  thenBranch: Stmt;
  elseBranch: Stmt | null;
}

export interface WhileStmt {
  type: "WhileStmt";
  condition: Expr;
  body: Stmt;
}

export interface ForStmt {
  type: "ForStmt";
  initializer: Stmt | null;
  condition: Expr | null;
  increment: Expr | null;
  body: Stmt;
}

export interface FunctionStmt {
  type: "FunctionStmt";
  name: Token | null;
  params: Token[];
  defaults: (Expr | null)[];
  body: Stmt[];
  restParam: Token | null;
}

export interface ReturnStmt {
  type: "ReturnStmt";
  keyword: Token;
  value: Expr | null;
}

export interface ClassStmt {
  type: "ClassStmt";
  name: Token;
  superclass: VariableExpr | null;
  methods: FunctionStmt[];
  properties: Map<string, Expr>;
}

export interface ExportStmt {
  type: "ExportStmt";
  name: Token;
  value: Expr | null;
}

// Type guards
export function isExpressionStmt(stmt: Stmt): stmt is ExpressionStmt {
  return stmt.type === "ExpressionStmt";
}

export function isVarStmt(stmt: Stmt): stmt is VarStmt {
  return stmt.type === "VarStmt";
}

export function isBlockStmt(stmt: Stmt): stmt is BlockStmt {
  return stmt.type === "BlockStmt";
}

export function isIfStmt(stmt: Stmt): stmt is IfStmt {
  return stmt.type === "IfStmt";
}

export function isWhileStmt(stmt: Stmt): stmt is WhileStmt {
  return stmt.type === "WhileStmt";
}

export function isForStmt(stmt: Stmt): stmt is ForStmt {
  return stmt.type === "ForStmt";
}

export function isFunctionStmt(stmt: Stmt): stmt is FunctionStmt {
  return stmt.type === "FunctionStmt";
}

export function isReturnStmt(stmt: Stmt): stmt is ReturnStmt {
  return stmt.type === "ReturnStmt";
}

export function isClassStmt(stmt: Stmt): stmt is ClassStmt {
  return stmt.type === "ClassStmt";
}

export function isExportStmt(stmt: Stmt): stmt is ExportStmt {
  return stmt.type === "ExportStmt";
}

export function isBinaryExpr(expr: Expr): expr is BinaryExpr {
  return expr.type === "BinaryExpr";
}

export function isGroupingExpr(expr: Expr): expr is GroupingExpr {
  return expr.type === "GroupingExpr";
}

export function isLiteralExpr(expr: Expr): expr is LiteralExpr {
  return expr.type === "LiteralExpr";
}

export function isUnaryExpr(expr: Expr): expr is UnaryExpr {
  return expr.type === "UnaryExpr";
}

export function isVariableExpr(expr: Expr): expr is VariableExpr {
  return expr.type === "VariableExpr";
}

export function isAssignExpr(expr: Expr): expr is AssignExpr {
  return expr.type === "AssignExpr";
}

export function isLogicalExpr(expr: Expr): expr is LogicalExpr {
  return expr.type === "LogicalExpr";
}

export function isCallExpr(expr: Expr): expr is CallExpr {
  return expr.type === "CallExpr";
}

export function isGetExpr(expr: Expr): expr is GetExpr {
  return expr.type === "GetExpr";
}

export function isSetExpr(expr: Expr): expr is SetExpr {
  return expr.type === "SetExpr";
}

export function isThisExpr(expr: Expr): expr is ThisExpr {
  return expr.type === "ThisExpr";
}

export function isSuperExpr(expr: Expr): expr is SuperExpr {
  return expr.type === "SuperExpr";
}

export function isNewExpr(expr: Expr): expr is NewExpr {
  return expr.type === "NewExpr";
}

export function isArrayExpr(expr: Expr): expr is ArrayExpr {
  return expr.type === "ArrayExpr";
}

export function isObjectExpr(expr: Expr): expr is ObjectExpr {
  return expr.type === "ObjectExpr";
}

export function isIndexExpr(expr: Expr): expr is IndexExpr {
  return expr.type === "IndexExpr";
}

export function isIndexAssignExpr(expr: Expr): expr is IndexAssignExpr {
  return expr.type === "IndexAssignExpr";
}

export function isTemplateStringExpr(expr: Expr): expr is TemplateStringExpr {
  return expr.type === "TemplateStringExpr";
}

export function isFunctionExpr(expr: Expr): expr is FunctionExpr {
  return expr.type === "FunctionExpr";
}

// Factory functions for creating AST nodes
export function createBinary(
  left: Expr,
  operator: Token,
  right: Expr
): BinaryExpr {
  return { type: "BinaryExpr", left, operator, right };
}

export function createGrouping(expression: Expr): GroupingExpr {
  return { type: "GroupingExpr", expression };
}

export function createLiteral(value: TokenLiteral): LiteralExpr {
  return { type: "LiteralExpr", value };
}

export function createUnary(operator: Token, right: Expr): UnaryExpr {
  return { type: "UnaryExpr", operator, right };
}

export function createVariable(name: Token): VariableExpr {
  return { type: "VariableExpr", name };
}

export function createAssign(name: Token, value: Expr): AssignExpr {
  return { type: "AssignExpr", name, value };
}

export function createLogical(
  left: Expr,
  operator: Token,
  right: Expr
): LogicalExpr {
  return { type: "LogicalExpr", left, operator, right };
}

export function createCall(callee: Expr, paren: Token, args: Expr[]): CallExpr {
  return { type: "CallExpr", callee, paren, args };
}

export function createGet(object: Expr, name: Token): GetExpr {
  return { type: "GetExpr", object, name };
}

export function createSet(object: Expr, name: Token, value: Expr): SetExpr {
  return { type: "SetExpr", object, name, value };
}

export function createThis(keyword: Token): ThisExpr {
  return { type: "ThisExpr", keyword };
}

export function createSuper(keyword: Token, method: Token): SuperExpr {
  return { type: "SuperExpr", keyword, method };
}

export function createNew(
  className: Token,
  paren: Token,
  args: Expr[]
): NewExpr {
  return { type: "NewExpr", className, args };
}

export function createArrayExpr(elements: Expr[]): ArrayExpr {
  return { type: "ArrayExpr", elements };
}

export function createObjectExpr(properties: Map<string, Expr>): ObjectExpr {
  return { type: "ObjectExpr", properties };
}

export function createIndexExpr(
  object: Expr,
  index: Expr,
  bracket: Token
): IndexExpr {
  return { type: "IndexExpr", object, index, bracket };
}

export function createIndexAssignExpr(
  object: Expr,
  index: Expr,
  value: Expr
): IndexAssignExpr {
  return { type: "IndexAssignExpr", object, index, value };
}

export function createTemplateStringExpr(
  parts: (string | { expr: Expr })[]
): TemplateStringExpr {
  return { type: "TemplateStringExpr", parts };
}

export function createFunctionExpr(
  name: Token | null,
  params: Token[],
  defaults: (Expr | null)[],
  body: Stmt[],
  restParam: Token | null
): FunctionExpr {
  return { type: "FunctionExpr", name, params, defaults, body, restParam };
}

// Statement factory functions
export function createExpressionStmt(expression: Expr): ExpressionStmt {
  return { type: "ExpressionStmt", expression };
}

export function createVarStmt(
  name: Token,
  initializer: Expr | null,
  isConst: boolean
): VarStmt {
  return { type: "VarStmt", name, initializer, isConst };
}

export function createBlockStmt(statements: Stmt[]): BlockStmt {
  return { type: "BlockStmt", statements };
}

export function createIfStmt(
  condition: Expr,
  thenBranch: Stmt,
  elseBranch: Stmt | null
): IfStmt {
  return { type: "IfStmt", condition, thenBranch, elseBranch };
}

export function createWhileStmt(condition: Expr, body: Stmt): WhileStmt {
  return { type: "WhileStmt", condition, body };
}

export function createForStmt(
  initializer: Stmt | null,
  condition: Expr | null,
  increment: Expr | null,
  body: Stmt
): ForStmt {
  return { type: "ForStmt", initializer, condition, increment, body };
}

export function createFunctionStmt(
  name: Token | null,
  params: Token[],
  defaults: (Expr | null)[],
  body: Stmt[],
  restParam: Token | null
): FunctionStmt {
  return { type: "FunctionStmt", name, params, defaults, body, restParam };
}

export function createReturnStmt(
  keyword: Token,
  value: Expr | null
): ReturnStmt {
  return { type: "ReturnStmt", keyword, value };
}

export function createClassStmt(
  name: Token,
  superclass: VariableExpr | null,
  methods: FunctionStmt[],
  properties: Map<string, Expr>
): ClassStmt {
  return { type: "ClassStmt", name, superclass, methods, properties };
}

export function createExportStmt(name: Token, value: Expr | null): ExportStmt {
  return { type: "ExportStmt", name, value };
}
