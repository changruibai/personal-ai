-- CreateTable
CREATE TABLE "assistant_favorites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "assistant_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "assistant_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assistant_favorites_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "ai_assistants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ai_assistants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "avatar" TEXT,
    "system_prompt" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'gpt-4o',
    "temperature" REAL NOT NULL DEFAULT 0.9,
    "max_tokens" INTEGER NOT NULL DEFAULT 4096,
    "skills" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "related_questions_enabled" BOOLEAN NOT NULL DEFAULT true,
    "related_questions_mode" TEXT NOT NULL DEFAULT 'llm',
    "related_questions_count" INTEGER NOT NULL DEFAULT 3,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ai_assistants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ai_assistants" ("avatar", "created_at", "description", "id", "is_default", "max_tokens", "model", "name", "related_questions_count", "related_questions_enabled", "related_questions_mode", "skills", "system_prompt", "temperature", "updated_at", "user_id") SELECT "avatar", "created_at", "description", "id", "is_default", "max_tokens", "model", "name", "related_questions_count", "related_questions_enabled", "related_questions_mode", "skills", "system_prompt", "temperature", "updated_at", "user_id" FROM "ai_assistants";
DROP TABLE "ai_assistants";
ALTER TABLE "new_ai_assistants" RENAME TO "ai_assistants";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "assistant_favorites_user_id_assistant_id_key" ON "assistant_favorites"("user_id", "assistant_id");
