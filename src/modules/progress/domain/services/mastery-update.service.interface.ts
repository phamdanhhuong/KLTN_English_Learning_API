export interface MasteryUpdateServiceInterface {
  updateMasteries(
    userId: string,
    exercises: any[],
    wordsMap: Map<string, string[]>,
    grammarsMap: Map<string, string[]>,
  ): Promise<{
    wordMasteriesUpdated: number;
    grammarMasteriesUpdated: number;
  }>;
}
