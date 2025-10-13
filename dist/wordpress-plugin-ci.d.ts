export interface PluginTestConfig {
    pluginPath: string;
    phpVersion: string;
    wordpressVersion: string;
    testCommand: string;
    setupScript?: string;
}
export interface TestResult {
    success: boolean;
    output: string;
    error?: string;
}
export declare function runWordPressPluginTests(config: PluginTestConfig): Promise<TestResult>;
