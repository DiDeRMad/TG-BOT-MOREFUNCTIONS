import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { GameServer } from '@core/GameServer';
import { Logger } from '@core/Logger';
import { DatabaseManager } from '@database/DatabaseManager';
import { RedisManager } from '@caching/RedisManager';
import { MetricsCollector } from '@monitoring/MetricsCollector';
import { ConfigManager } from '@core/ConfigManager';
import { ClusterManager } from '@scaling/ClusterManager';
import { SecurityManager } from '@security/SecurityManager';
import { NetworkManager } from '@network/NetworkManager';
import { WorldManager } from '@world/WorldManager';
import { EventBus } from '@core/EventBus';
import { PluginManager } from '@modding/PluginManager';
import { BackupManager } from '@backup/BackupManager';
import { AnalyticsEngine } from '@analytics/AnalyticsEngine';
import { AIManager } from '@ai/AIManager';
import { PhysicsEngine } from '@physics/PhysicsEngine';
import { EconomySimulator } from '@economy-sim/EconomySimulator';
import { QuestEngine } from '@quests/QuestEngine';
import { CombatSystem } from '@combat/CombatSystem';
import { ChatManager } from '@chat/ChatManager';
import { MatchmakingService } from '@matchmaking/MatchmakingService';
import { LeaderboardService } from '@leaderboards/LeaderboardService';
import { AchievementSystem } from '@achievements/AchievementSystem';
import { CraftingSystem } from '@crafting/CraftingSystem';
import { TradingSystem } from '@trading/TradingSystem';
import { AuctionHouse } from '@auction/AuctionHouse';
import { GuildManager } from '@guilds/GuildManager';
import { PartyManager } from '@party/PartyManager';
import { RaidManager } from '@raid/RaidManager';
import { PvPManager } from '@pvp/PvPManager';
import { DungeonGenerator } from '@dungeons/DungeonGenerator';
import { BossManager } from '@bosses/BossManager';
import { NPCManager } from '@npcs/NPCManager';
import { MonsterSpawner } from '@monsters/MonsterSpawner';
import { ItemManager } from '@items/ItemManager';
import { SkillSystem } from '@skills/SkillSystem';
import { SpellSystem } from '@spells/SpellSystem';
import { TalentTree } from '@talents/TalentTree';
import { BuffDebuffManager } from '@buffs/BuffDebuffManager';
import { LocalizationManager } from '@localization/LocalizationManager';
import { SessionManager } from '@sessions/SessionManager';
import { AuthenticationService } from '@authentication/AuthenticationService';
import { AuthorizationService } from '@authorization/AuthorizationService';
import { TerritoryManager } from '@territories/TerritoryManager';
import { WarfareSystem } from '@wars/WarfareSystem';
import { DiplomacyEngine } from '@diplomacy/DiplomacyEngine';
import { MarketSimulator } from '@market/MarketSimulator';
import { ContractSystem } from '@contracts/ContractSystem';
import { WorkflowEngine } from '@workflows/WorkflowEngine';
import { QueueManager } from '@queues/QueueManager';
import { LoadBalancer } from '@load-balancing/LoadBalancer';
import { DisasterRecovery } from '@disaster-recovery/DisasterRecovery';
import { TransactionManager } from '@transactions/TransactionManager';
import { StreamProcessor } from '@streams/StreamProcessor';
import { GraphicsOptimizer } from '@graphics/GraphicsOptimizer';
import { AudioEngine } from '@audio/AudioEngine';
import { AnimationSystem } from '@animations/AnimationSystem';
import { ParticleSystem } from '@particles/ParticleSystem';
import { ShaderCompiler } from '@shaders/ShaderCompiler';
import { ModelLoader } from '@models/ModelLoader';
import { CinematicPlayer } from '@cinematics/CinematicPlayer';
import { TutorialSystem } from '@tutorials/TutorialSystem';
import { ProgressionTracker } from '@progression/ProgressionTracker';
import { ReputationSystem } from '@reputation/ReputationSystem';
import { CurrencyManager } from '@currencies/CurrencyManager';
import { RewardDistributor } from '@rewards/RewardDistributor';
import { LootGenerator } from '@loot/LootGenerator';
import { RNGService } from '@rng/RNGService';
import { BalancingEngine } from '@balancing/BalancingEngine';
import { FormulaCalculator } from '@formulas/FormulaCalculator';
import { ValidationService } from '@validations/ValidationService';
import { EncryptionService } from '@encryption/EncryptionService';
import { TokenService } from '@tokens/TokenService';
import { PermissionManager } from '@permissions/PermissionManager';
import { RoleManager } from '@roles/RoleManager';
import { FactionManager } from '@factions/FactionManager';
import { PoliticalSystem } from '@politics/PoliticalSystem';
import { TaxationSystem } from '@taxes/TaxationSystem';
import { LegalFramework } from '@laws/LegalFramework';
import { PolicyEngine } from '@policies/PolicyEngine';
import { SchedulerService } from '@schedulers/SchedulerService';
import { WorkerPool } from '@workers/WorkerPool';
import { ProcessManager } from '@processes/ProcessManager';
import { ContainerOrchestrator } from '@orchestration/ContainerOrchestrator';
import { AutoScaler } from '@scaling/AutoScaler';
import { FailoverManager } from '@failover/FailoverManager';
import { ResilienceFramework } from '@resilience/ResilienceFramework';
import { ReplicationService } from '@replication/ReplicationService';
import { ConsistencyChecker } from '@consistency/ConsistencyChecker';
import { LockManager } from '@locks/LockManager';
import { AsyncOperationManager } from '@async/AsyncOperationManager';
import { CoroutineScheduler } from '@coroutines/CoroutineScheduler';
import { ObservableSystem } from '@observables/ObservableSystem';
import { DataTransformer } from '@transformers/DataTransformer';
import { MessageFilter } from '@filters/MessageFilter';
import { DataMapper } from '@mappers/DataMapper';
import { StateReducer } from '@reducers/StateReducer';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = new Logger('MainServer');

// Main server class
class MainServer {
  private gameServer!: GameServer;
  private configManager!: ConfigManager;
  private databaseManager!: DatabaseManager;
  private redisManager!: RedisManager;
  private metricsCollector!: MetricsCollector;
  private clusterManager!: ClusterManager;
  private securityManager!: SecurityManager;
  private networkManager!: NetworkManager;
  private worldManager!: WorldManager;
  private eventBus!: EventBus;
  private pluginManager!: PluginManager;
  private backupManager!: BackupManager;
  private analyticsEngine!: AnalyticsEngine;
  private aiManager!: AIManager;
  private physicsEngine!: PhysicsEngine;
  private economySimulator!: EconomySimulator;
  private questEngine!: QuestEngine;
  private combatSystem!: CombatSystem;
  private chatManager!: ChatManager;
  private matchmakingService!: MatchmakingService;
  private leaderboardService!: LeaderboardService;
  private achievementSystem!: AchievementSystem;
  private craftingSystem!: CraftingSystem;
  private tradingSystem!: TradingSystem;
  private auctionHouse!: AuctionHouse;
  private guildManager!: GuildManager;
  private partyManager!: PartyManager;
  private raidManager!: RaidManager;
  private pvpManager!: PvPManager;
  private dungeonGenerator!: DungeonGenerator;
  private bossManager!: BossManager;
  private npcManager!: NPCManager;
  private monsterSpawner!: MonsterSpawner;
  private itemManager!: ItemManager;
  private skillSystem!: SkillSystem;
  private spellSystem!: SpellSystem;
  private talentTree!: TalentTree;
  private buffDebuffManager!: BuffDebuffManager;
  private localizationManager!: LocalizationManager;
  private sessionManager!: SessionManager;
  private authenticationService!: AuthenticationService;
  private authorizationService!: AuthorizationService;
  private territoryManager!: TerritoryManager;
  private warfareSystem!: WarfareSystem;
  private diplomacyEngine!: DiplomacyEngine;
  private marketSimulator!: MarketSimulator;
  private contractSystem!: ContractSystem;
  private workflowEngine!: WorkflowEngine;
  private queueManager!: QueueManager;
  private loadBalancer!: LoadBalancer;
  private disasterRecovery!: DisasterRecovery;
  private transactionManager!: TransactionManager;
  private streamProcessor!: StreamProcessor;
  private graphicsOptimizer!: GraphicsOptimizer;
  private audioEngine!: AudioEngine;
  private animationSystem!: AnimationSystem;
  private particleSystem!: ParticleSystem;
  private shaderCompiler!: ShaderCompiler;
  private modelLoader!: ModelLoader;
  private cinematicPlayer!: CinematicPlayer;
  private tutorialSystem!: TutorialSystem;
  private progressionTracker!: ProgressionTracker;
  private reputationSystem!: ReputationSystem;
  private currencyManager!: CurrencyManager;
  private rewardDistributor!: RewardDistributor;
  private lootGenerator!: LootGenerator;
  private rngService!: RNGService;
  private balancingEngine!: BalancingEngine;
  private formulaCalculator!: FormulaCalculator;
  private validationService!: ValidationService;
  private encryptionService!: EncryptionService;
  private tokenService!: TokenService;
  private permissionManager!: PermissionManager;
  private roleManager!: RoleManager;
  private factionManager!: FactionManager;
  private politicalSystem!: PoliticalSystem;
  private taxationSystem!: TaxationSystem;
  private legalFramework!: LegalFramework;
  private policyEngine!: PolicyEngine;
  private schedulerService!: SchedulerService;
  private workerPool!: WorkerPool;
  private processManager!: ProcessManager;
  private containerOrchestrator!: ContainerOrchestrator;
  private autoScaler!: AutoScaler;
  private failoverManager!: FailoverManager;
  private resilienceFramework!: ResilienceFramework;
  private replicationService!: ReplicationService;
  private consistencyChecker!: ConsistencyChecker;
  private lockManager!: LockManager;
  private asyncOperationManager!: AsyncOperationManager;
  private coroutineScheduler!: CoroutineScheduler;
  private observableSystem!: ObservableSystem;
  private dataTransformer!: DataTransformer;
  private messageFilter!: MessageFilter;
  private dataMapper!: DataMapper;
  private stateReducer!: StateReducer;

  constructor() {
    this.initializeManagers();
    this.setupEventHandlers();
    this.registerShutdownHandlers();
  }

  private initializeManagers(): void {
    logger.info('Initializing server managers...');

    // Core systems
    this.configManager = new ConfigManager();
    this.eventBus = new EventBus();
    this.securityManager = new SecurityManager(this.configManager);
    this.validationService = new ValidationService();
    this.encryptionService = new EncryptionService(this.configManager);
    this.tokenService = new TokenService(this.encryptionService);

    // Database and caching
    this.databaseManager = new DatabaseManager(this.configManager);
    this.redisManager = new RedisManager(this.configManager);
    this.transactionManager = new TransactionManager(this.databaseManager);

    // Monitoring and analytics
    this.metricsCollector = new MetricsCollector(this.configManager);
    this.analyticsEngine = new AnalyticsEngine(this.metricsCollector);

    // Network and scaling
    this.networkManager = new NetworkManager(this.configManager, this.securityManager);
    this.clusterManager = new ClusterManager(this.configManager);
    this.loadBalancer = new LoadBalancer(this.clusterManager);
    this.autoScaler = new AutoScaler(this.metricsCollector, this.clusterManager);

    // Authentication and authorization
    this.sessionManager = new SessionManager(this.redisManager, this.tokenService);
    this.authenticationService = new AuthenticationService(this.databaseManager, this.sessionManager);
    this.authorizationService = new AuthorizationService(this.databaseManager);
    this.permissionManager = new PermissionManager(this.authorizationService);
    this.roleManager = new RoleManager(this.permissionManager);

    // Game world
    this.worldManager = new WorldManager(this.databaseManager, this.eventBus);
    this.physicsEngine = new PhysicsEngine(this.worldManager);
    this.aiManager = new AIManager(this.worldManager, this.physicsEngine);

    // Economy and trading
    this.economySimulator = new EconomySimulator(this.worldManager, this.eventBus);
    this.currencyManager = new CurrencyManager(this.economySimulator);
    this.marketSimulator = new MarketSimulator(this.economySimulator);
    this.tradingSystem = new TradingSystem(this.currencyManager, this.marketSimulator);
    this.auctionHouse = new AuctionHouse(this.tradingSystem, this.marketSimulator);
    this.taxationSystem = new TaxationSystem(this.economySimulator, this.currencyManager);

    // Combat and skills
    this.combatSystem = new CombatSystem(this.worldManager, this.physicsEngine);
    this.skillSystem = new SkillSystem(this.combatSystem);
    this.spellSystem = new SpellSystem(this.skillSystem, this.combatSystem);
    this.talentTree = new TalentTree(this.skillSystem);
    this.buffDebuffManager = new BuffDebuffManager(this.combatSystem);

    // Items and crafting
    this.itemManager = new ItemManager(this.databaseManager);
    this.craftingSystem = new CraftingSystem(this.itemManager);
    this.lootGenerator = new LootGenerator(this.itemManager, this.rngService);

    // NPCs and monsters
    this.npcManager = new NPCManager(this.worldManager, this.aiManager);
    this.monsterSpawner = new MonsterSpawner(this.worldManager, this.npcManager);
    this.bossManager = new BossManager(this.monsterSpawner, this.combatSystem);

    // Quests and progression
    this.questEngine = new QuestEngine(this.worldManager, this.eventBus);
    this.progressionTracker = new ProgressionTracker(this.questEngine);
    this.achievementSystem = new AchievementSystem(this.progressionTracker);
    this.reputationSystem = new ReputationSystem(this.progressionTracker);

    // Social features
    this.chatManager = new ChatManager(this.sessionManager, this.messageFilter);
    this.guildManager = new GuildManager(this.databaseManager, this.chatManager);
    this.partyManager = new PartyManager(this.sessionManager);
    this.raidManager = new RaidManager(this.partyManager);

    // PvP and territory
    this.pvpManager = new PvPManager(this.combatSystem, this.worldManager);
    this.territoryManager = new TerritoryManager(this.worldManager);
    this.warfareSystem = new WarfareSystem(this.territoryManager, this.pvpManager);
    this.factionManager = new FactionManager(this.territoryManager);
    this.diplomacyEngine = new DiplomacyEngine(this.factionManager);
    this.politicalSystem = new PoliticalSystem(this.diplomacyEngine, this.factionManager);

    // Dungeons and content
    this.dungeonGenerator = new DungeonGenerator(this.worldManager);
    this.matchmakingService = new MatchmakingService(this.sessionManager);
    this.leaderboardService = new LeaderboardService(this.redisManager);

    // Systems and services
    this.rewardDistributor = new RewardDistributor(this.itemManager, this.currencyManager);
    this.rngService = new RNGService();
    this.balancingEngine = new BalancingEngine(this.analyticsEngine);
    this.formulaCalculator = new FormulaCalculator(this.balancingEngine);

    // Legal and policy
    this.legalFramework = new LegalFramework(this.politicalSystem);
    this.policyEngine = new PolicyEngine(this.legalFramework);
    this.contractSystem = new ContractSystem(this.legalFramework);

    // Graphics and audio
    this.graphicsOptimizer = new GraphicsOptimizer();
    this.audioEngine = new AudioEngine();
    this.animationSystem = new AnimationSystem();
    this.particleSystem = new ParticleSystem();
    this.shaderCompiler = new ShaderCompiler();
    this.modelLoader = new ModelLoader();
    this.cinematicPlayer = new CinematicPlayer(this.audioEngine, this.graphicsOptimizer);

    // Tutorial and onboarding
    this.tutorialSystem = new TutorialSystem(this.questEngine);
    this.localizationManager = new LocalizationManager(this.configManager);

    // Infrastructure
    this.schedulerService = new SchedulerService();
    this.workerPool = new WorkerPool(this.configManager);
    this.processManager = new ProcessManager(this.workerPool);
    this.containerOrchestrator = new ContainerOrchestrator(this.configManager);
    this.queueManager = new QueueManager(this.redisManager);
    this.workflowEngine = new WorkflowEngine(this.queueManager);

    // Reliability and recovery
    this.failoverManager = new FailoverManager(this.clusterManager);
    this.disasterRecovery = new DisasterRecovery(this.backupManager);
    this.resilienceFramework = new ResilienceFramework(this.failoverManager);
    this.replicationService = new ReplicationService(this.databaseManager);
    this.consistencyChecker = new ConsistencyChecker(this.replicationService);
    this.backupManager = new BackupManager(this.databaseManager, this.configManager);

    // Concurrency and async
    this.lockManager = new LockManager(this.redisManager);
    this.asyncOperationManager = new AsyncOperationManager();
    this.coroutineScheduler = new CoroutineScheduler();
    this.streamProcessor = new StreamProcessor();
    this.observableSystem = new ObservableSystem();

    // Data processing
    this.dataTransformer = new DataTransformer();
    this.messageFilter = new MessageFilter();
    this.dataMapper = new DataMapper();
    this.stateReducer = new StateReducer();

    // Modding support
    this.pluginManager = new PluginManager(this.eventBus);

    // Main game server
    this.gameServer = new GameServer({
      configManager: this.configManager,
      databaseManager: this.databaseManager,
      redisManager: this.redisManager,
      networkManager: this.networkManager,
      worldManager: this.worldManager,
      eventBus: this.eventBus,
      securityManager: this.securityManager,
      sessionManager: this.sessionManager,
      metricsCollector: this.metricsCollector
    });

    logger.info('All managers initialized successfully');
  }

  private setupEventHandlers(): void {
    logger.info('Setting up event handlers...');

    // Player events
    this.eventBus.on('player:connect', this.handlePlayerConnect.bind(this));
    this.eventBus.on('player:disconnect', this.handlePlayerDisconnect.bind(this));
    this.eventBus.on('player:move', this.handlePlayerMove.bind(this));
    this.eventBus.on('player:action', this.handlePlayerAction.bind(this));

    // Combat events
    this.eventBus.on('combat:start', this.handleCombatStart.bind(this));
    this.eventBus.on('combat:end', this.handleCombatEnd.bind(this));
    this.eventBus.on('combat:damage', this.handleCombatDamage.bind(this));

    // Economy events
    this.eventBus.on('economy:transaction', this.handleEconomyTransaction.bind(this));
    this.eventBus.on('economy:marketUpdate', this.handleMarketUpdate.bind(this));

    // World events
    this.eventBus.on('world:spawn', this.handleWorldSpawn.bind(this));
    this.eventBus.on('world:despawn', this.handleWorldDespawn.bind(this));
    this.eventBus.on('world:update', this.handleWorldUpdate.bind(this));

    // System events
    this.eventBus.on('system:error', this.handleSystemError.bind(this));
    this.eventBus.on('system:warning', this.handleSystemWarning.bind(this));
    this.eventBus.on('system:metrics', this.handleSystemMetrics.bind(this));

    logger.info('Event handlers set up successfully');
  }

  private registerShutdownHandlers(): void {
    process.on('SIGTERM', this.shutdown.bind(this));
    process.on('SIGINT', this.shutdown.bind(this));
    process.on('uncaughtException', this.handleUncaughtException.bind(this));
    process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));
  }

  public async start(): Promise<void> {
    try {
      logger.info('Starting Epic MMORPG Server...');

      // Initialize database connections
      await this.databaseManager.connect();
      await this.redisManager.connect();

      // Run database migrations
      await this.databaseManager.runMigrations();

      // Load game data
      await this.loadGameData();

      // Start background services
      await this.startBackgroundServices();

      // Start the game server
      await this.gameServer.start();

      // Start cluster if enabled
      if (this.configManager.get('cluster.enabled')) {
        await this.clusterManager.start();
      }

      // Initialize plugins
      await this.pluginManager.loadPlugins();

      logger.info('Epic MMORPG Server started successfully!');
      logger.info(`Server is running on port ${this.configManager.get('server.port')}`);

      // Start monitoring
      this.metricsCollector.startCollection();

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private async loadGameData(): Promise<void> {
    logger.info('Loading game data...');

    const loadTasks = [
      this.itemManager.loadItems(),
      this.skillSystem.loadSkills(),
      this.spellSystem.loadSpells(),
      this.questEngine.loadQuests(),
      this.npcManager.loadNPCs(),
      this.monsterSpawner.loadMonsterTemplates(),
      this.dungeonGenerator.loadDungeonTemplates(),
      this.worldManager.loadWorldData(),
      this.localizationManager.loadLocalizations(),
      this.talentTree.loadTalentData(),
      this.achievementSystem.loadAchievements(),
      this.craftingSystem.loadRecipes(),
      this.reputationSystem.loadFactions(),
      this.territoryManager.loadTerritories(),
      this.legalFramework.loadLaws(),
      this.policyEngine.loadPolicies()
    ];

    await Promise.all(loadTasks);
    logger.info('Game data loaded successfully');
  }

  private async startBackgroundServices(): Promise<void> {
    logger.info('Starting background services...');

    // Start schedulers
    this.schedulerService.start();
    this.workerPool.start();
    this.coroutineScheduler.start();

    // Start monitors
    this.consistencyChecker.startChecking();
    this.autoScaler.startMonitoring();

    // Start simulators
    this.economySimulator.startSimulation();
    this.marketSimulator.startSimulation();
    this.politicalSystem.startSimulation();

    // Start spawners
    this.monsterSpawner.startSpawning();

    // Start backup service
    this.backupManager.startScheduledBackups();

    logger.info('Background services started');
  }

  // Event handlers
  private async handlePlayerConnect(data: any): Promise<void> {
    logger.debug('Player connected:', data.playerId);
    await this.sessionManager.createSession(data.playerId, data.connectionInfo);
    await this.worldManager.spawnPlayer(data.playerId);
    this.metricsCollector.incrementCounter('players.connected');
  }

  private async handlePlayerDisconnect(data: any): Promise<void> {
    logger.debug('Player disconnected:', data.playerId);
    await this.worldManager.despawnPlayer(data.playerId);
    await this.sessionManager.destroySession(data.playerId);
    this.metricsCollector.decrementCounter('players.connected');
  }

  private async handlePlayerMove(data: any): Promise<void> {
    await this.worldManager.updatePlayerPosition(data.playerId, data.position);
    await this.physicsEngine.updateCollisions(data.playerId);
  }

  private async handlePlayerAction(data: any): Promise<void> {
    // Route action to appropriate system
    switch (data.actionType) {
      case 'combat':
        await this.combatSystem.processAction(data);
        break;
      case 'trade':
        await this.tradingSystem.processAction(data);
        break;
      case 'craft':
        await this.craftingSystem.processAction(data);
        break;
      case 'quest':
        await this.questEngine.processAction(data);
        break;
      default:
        logger.warn('Unknown action type:', data.actionType);
    }
  }

  private async handleCombatStart(data: any): Promise<void> {
    await this.combatSystem.initiateCombat(data.participants);
    this.metricsCollector.incrementCounter('combat.sessions');
  }

  private async handleCombatEnd(data: any): Promise<void> {
    await this.combatSystem.endCombat(data.combatId);
    await this.rewardDistributor.distributeRewards(data.winners, data.rewards);
  }

  private async handleCombatDamage(data: any): Promise<void> {
    await this.combatSystem.applyDamage(data.targetId, data.damage, data.sourceId);
    this.metricsCollector.recordValue('combat.damage', data.damage);
  }

  private async handleEconomyTransaction(data: any): Promise<void> {
    await this.transactionManager.processTransaction(data);
    this.analyticsEngine.trackTransaction(data);
  }

  private async handleMarketUpdate(data: any): Promise<void> {
    await this.marketSimulator.updatePrices(data.itemId, data.price);
    this.eventBus.emit('ui:marketUpdate', data);
  }

  private async handleWorldSpawn(data: any): Promise<void> {
    await this.worldManager.spawnEntity(data.entityType, data.position, data.properties);
  }

  private async handleWorldDespawn(data: any): Promise<void> {
    await this.worldManager.despawnEntity(data.entityId);
  }

  private async handleWorldUpdate(data: any): Promise<void> {
    await this.worldManager.updateWorld(data.deltaTime);
    await this.physicsEngine.simulate(data.deltaTime);
  }

  private async handleSystemError(error: any): Promise<void> {
    logger.error('System error:', error);
    await this.failoverManager.handleError(error);
    this.metricsCollector.incrementCounter('system.errors');
  }

  private async handleSystemWarning(warning: any): Promise<void> {
    logger.warn('System warning:', warning);
    this.metricsCollector.incrementCounter('system.warnings');
  }

  private async handleSystemMetrics(metrics: any): Promise<void> {
    await this.metricsCollector.recordMetrics(metrics);
  }

  private handleUncaughtException(error: Error): void {
    logger.error('Uncaught exception:', error);
    this.shutdown();
  }

  private handleUnhandledRejection(reason: any): void {
    logger.error('Unhandled rejection:', reason);
  }

  private async shutdown(): Promise<void> {
    logger.info('Shutting down server...');

    try {
      // Stop accepting new connections
      await this.networkManager.stopAcceptingConnections();

      // Save world state
      await this.worldManager.saveWorldState();

      // Disconnect all players gracefully
      await this.sessionManager.disconnectAllPlayers();

      // Stop background services
      this.schedulerService.stop();
      this.workerPool.stop();
      this.economySimulator.stopSimulation();
      this.marketSimulator.stopSimulation();
      this.monsterSpawner.stopSpawning();

      // Perform final backup
      await this.backupManager.performBackup();

      // Close database connections
      await this.databaseManager.disconnect();
      await this.redisManager.disconnect();

      // Stop the game server
      await this.gameServer.stop();

      logger.info('Server shut down successfully');
      process.exit(0);

    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new MainServer();
server.start().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});