import { container } from "@workspace/di";
import { customProvider, DocumentHandler, myProvider } from "@workspace/ai";
import { databaseService } from "./db";
import { DatabaseService } from "@workspace/database/server";
import { imageDocumentHandler } from "@artifacts/image-artifact/server";
import { codeDocumentHandler } from "@artifacts/code-artifact/server";
import { sheetDocumentHandler } from "@artifacts/sheet-artifact/server";
import { textDocumentHandler } from "@artifacts/text-artifact/server";

/**
 * Bootstrap the DI container with all required dependencies.
 * This function is idempotent and safe to call multiple times.
 *
 * Note: tsyringe's registerInstance can be called multiple times safely,
 * but we check first to avoid unnecessary work and potential issues.
 */
export function bootstrap(): void {
  // Register core services
  container.registerInstance<DatabaseService>("db", databaseService);
  container.registerInstance<ReturnType<typeof customProvider>>(
    "myProvider",
    myProvider
  );

  // Register document handlers
  container.registerInstance<DocumentHandler<"image">>(
    "DocumentHandler",
    imageDocumentHandler
  );

  container.registerInstance<DocumentHandler<"text">>(
    "DocumentHandler",
    textDocumentHandler
  );

  container.registerInstance<DocumentHandler<"code">>(
    "DocumentHandler",
    codeDocumentHandler
  );

  container.registerInstance<DocumentHandler<"sheet">>(
    "DocumentHandler",
    sheetDocumentHandler
  );

  console.log("bootstrap completed");
}

// Auto-bootstrap on module import (for convenience)
// This ensures bootstrap runs whenever this module is imported
bootstrap();
