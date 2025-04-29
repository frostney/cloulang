import type { Token, TokenLiteral } from "./token-types";

interface Node {
  accept<R>(visitor: Visitor<R>): R;
}

// Interface for the Visitor pattern
export interface Visitor<R> {
  visitBinaryExpr(expr: Binary): R;
  visitGroupingExpr(expr: Grouping): R;
  visitLiteralExpr(expr: Literal): R;
  visitUnaryExpr(expr: Unary): R;
  visitVariableExpr(expr: Variable): R;
  visitAssignExpr(expr: Assign): R;
  visitLogicalExpr(expr: Logical): R;
  visitCallExpr(expr: Call): R;
  visitGetExpr(expr: Get): R;
  visitSetExpr(expr: Set): R;
  visitThisExpr(expr: This): R;
  visitSuperExpr(expr: Super): R;
  visitNewExpr(expr: New): R;
  visitArrayExpr(expr: ArrayExpr): R;
  visitObjectExpr(expr: Object): R;
  visitIndexExpr(expr: Index): R;
  visitIndexAssignExpr(expr: IndexAssign): R;

  visitExpressionStmt(stmt: Expression): R;
  visitVarStmt(stmt: Var): R;
  visitBlockStmt(stmt: Block): R;
  visitIfStmt(stmt: If): R;
  visitWhileStmt(stmt: While): R;
  visitForStmt(stmt: For): R;
  visitFunctionStmt(stmt: Function): R;
  visitReturnStmt(stmt: Return): R;
  visitClassStmt(stmt: Class): R;
  visitExportStmt(stmt: Export): R;
}

// Expression nodes
export class Binary implements Node {
  constructor(public left: Expr, public operator: Token, public right: Expr) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitBinaryExpr(this);
  }
}

export class Grouping implements Node {
  constructor(public expression: Expr) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitGroupingExpr(this);
  }
}

export class Literal implements Node {
  constructor(public value: TokenLiteral) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitLiteralExpr(this);
  }
}

export class Unary implements Node {
  constructor(public operator: Token, public right: Expr) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitUnaryExpr(this);
  }
}

export class Variable implements Node {
  constructor(public name: Token) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitVariableExpr(this);
  }
}

export class Assign implements Node {
  constructor(public name: Token, public value: Expr) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitAssignExpr(this);
  }
}

export class Logical implements Node {
  constructor(public left: Expr, public operator: Token, public right: Expr) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitLogicalExpr(this);
  }
}

export class Call implements Node {
  constructor(public callee: Expr, public paren: Token, public args: Expr[]) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitCallExpr(this);
  }
}

export class Get implements Node {
  constructor(public object: Expr, public name: Token) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitGetExpr(this);
  }
}

export class Set implements Node {
  constructor(public object: Expr, public name: Token, public value: Expr) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitSetExpr(this);
  }
}

export class This implements Node {
  constructor(public keyword: Token) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitThisExpr(this);
  }
}

export class Super implements Node {
  constructor(public keyword: Token, public method: Token) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitSuperExpr(this);
  }
}

export class New implements Node {
  constructor(
    public className: Token,
    public paren: Token,
    public args: Expr[]
  ) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitNewExpr(this);
  }
}

export class ArrayExpr implements Node {
  constructor(public elements: Expr[]) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitArrayExpr(this);
  }
}

export class Object implements Node {
  constructor(public properties: Map<string, Expr>) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitObjectExpr(this);
  }
}

export class Index implements Node {
  constructor(public object: Expr, public index: Expr) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitIndexExpr(this);
  }
}

export class IndexAssign implements Node {
  constructor(public object: Expr, public index: Expr, public value: Expr) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitIndexAssignExpr(this);
  }
}

// Statement nodes
export class Expression implements Node {
  constructor(public expression: Expr) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitExpressionStmt(this);
  }
}

export class Var implements Node {
  constructor(
    public name: Token,
    public initializer: Expr | null,
    public isConst: boolean
  ) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitVarStmt(this);
  }
}

export class Block implements Node {
  constructor(public statements: Stmt[]) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitBlockStmt(this);
  }
}

export class If implements Node {
  constructor(
    public condition: Expr,
    public thenBranch: Stmt,
    public elseBranch: Stmt | null
  ) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitIfStmt(this);
  }
}

export class While implements Node {
  constructor(public condition: Expr, public body: Stmt) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitWhileStmt(this);
  }
}

export class For implements Node {
  constructor(
    public initializer: Stmt | null,
    public condition: Expr | null,
    public increment: Expr | null,
    public body: Stmt
  ) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitForStmt(this);
  }
}

export class Function implements Node {
  constructor(
    public name: Token | null,
    public params: Token[],
    public defaults: (Expr | null)[],
    public body: Stmt[],
    public restParam: Token | null = null
  ) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitFunctionStmt(this);
  }
}

export class Return implements Node {
  constructor(public keyword: Token, public value: Expr | null) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitReturnStmt(this);
  }
}

export class Class implements Node {
  constructor(
    public name: Token,
    public superclass: Variable | null,
    public methods: Function[]
  ) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitClassStmt(this);
  }
}

export class Export implements Node {
  constructor(public name: Token, public value: Expr | null) {}

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitExportStmt(this);
  }
}

// Type aliases for better readability
export type Expr =
  | Binary
  | Grouping
  | Literal
  | Unary
  | Variable
  | Assign
  | Logical
  | Call
  | Get
  | Set
  | This
  | Super
  | New
  | ArrayExpr
  | Object
  | Index
  | IndexAssign
  | Function;

export type Stmt =
  | Expression
  | Var
  | Block
  | If
  | While
  | For
  | Function
  | Return
  | Class;
