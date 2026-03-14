-- CreateTable
CREATE TABLE "ExerciseVideo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exerciseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    CONSTRAINT "ExerciseVideo_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
