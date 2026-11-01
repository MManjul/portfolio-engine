/**
 * Unreal Engine 5 StateTree & Gameplay Tag Interactive Visualizer
 * Models Mayank's AAA ECricket Batsman Locomotion & Authoritative StateTree Architecture.
 * Simulates runtime state transitions, tag evaluation, and displays low-level C++ delegates.
 */
class StateTreeVisualizer {
  constructor() {
    this.buttons = document.querySelectorAll('.node-state-btn');
    this.nodes = document.querySelectorAll('.graph-node-group');
    this.cables = document.querySelectorAll('.cable');
    this.snippetBox = document.getElementById('snippet-code-box');

    this.states = {
      stance: {
        activeNodes: ['node-root', 'node-locomotion', 'node-idle'],
        activeCables: ['cable-root-loco', 'cable-loco-idle'],
        code: `// StateTree Task: Crease Stance & Bowler Release Synchronization (UE5 / ECricket)
EStateTreeRunStatus FECricketBattingStanceTask::EnterState(FStateTreeExecutionContext& Context)
{
    UECricketBatsmanComponent* BatsmanComp = Context.GetExternalData(BatsmanCompHandle);
    if (!BatsmanComp) return EStateTreeRunStatus::Failed;

    // Reset stroke tags and bind batsman crease stance gaze tracking
    BatsmanComp->RemoveGameplayTag(TAG_State_StrokeExecution);
    BatsmanComp->AddGameplayTag(TAG_State_Batting_CreaseStance);

    // Lock batsman root orientation toward pitch delivery vector (Server-Authoritative)
    BatsmanComp->SetBattingStanceBlendWeights(1.0f);
    return EStateTreeRunStatus::Running;
}`
      },
      stroke: {
        activeNodes: ['node-root', 'node-abilities', 'node-dodge'],
        activeCables: ['cable-root-abilities', 'cable-abilities-dodge', 'cable-rep-sync'],
        code: `// StateTree Task: Real-Time Ballistics Collision & Server-Authoritative Stroke (UE5)
EStateTreeRunStatus FECricketStrokeExecutionTask::EnterState(FStateTreeExecutionContext& Context)
{
    UECricketBatsmanComponent* BatsmanComp = Context.GetExternalData(BatsmanCompHandle);
    if (!BatsmanComp) return EStateTreeRunStatus::Failed;

    // Evaluate incoming ball trajectory from server ballistics pipeline
    const FVector ImpactPoint = BatsmanComp->GetCalculatedImpactPoint();
    BatsmanComp->AddGameplayTag(TAG_State_StrokeExecution);

    // Execute root-motion stroke and dispatch server RPC verification
    BatsmanComp->Server_ReportAuthoritativeImpact(ImpactPoint, BatsmanComp->GetBatVelocity());
    return EStateTreeRunStatus::Running;
}`
      },
      sprint: {
        activeNodes: ['node-root', 'node-locomotion', 'node-sprint'],
        activeCables: ['cable-root-loco', 'cable-loco-sprint'],
        code: `// StateTree Task: Sprint Between Wickets & Crease Grounding (UE5 / ECricket)
EStateTreeRunStatus FECricketRunningBetweenWicketsTask::EnterState(FStateTreeExecutionContext& Context)
{
    UECricketMovementComponent* MoveComp = Context.GetExternalData(MoveCompHandle);
    if (!MoveComp) return EStateTreeRunStatus::Failed;

    // Accelerate between stumps with root-motion momentum
    MoveComp->AddGameplayTag(TAG_Locomotion_SprintBetweenWickets);
    MoveComp->SetMaxWalkSpeed(840.0f); // 8.4 m/s athletic sprint

    // Dispatch server-authoritative prediction payload for crease crossing
    MoveComp->Server_SendPredictionPayload(MoveComp->GetLastTimestamp(), TAG_Locomotion_SprintBetweenWickets);
    return EStateTreeRunStatus::Running;
}`
      },
      defense: {
        activeNodes: ['node-root', 'node-abilities', 'node-abilitycast'],
        activeCables: ['cable-root-abilities', 'cable-abilities-cast', 'cable-rep-sync'],
        code: `// StateTree Task: Soft-Hands Forward Defense & Bounce Evasion (UE5 / ECricket)
EStateTreeRunStatus FECricketDefensiveBlockTask::EnterState(FStateTreeExecutionContext& Context)
{
    UECricketBatsmanComponent* BatsmanComp = Context.GetExternalData(BatsmanCompHandle);
    if (!BatsmanComp) return EStateTreeRunStatus::Failed;

    // Dampen bat restitution coefficient to drop ball softly into pitch
    BatsmanComp->AddGameplayTag(TAG_State_DefensiveBlock);
    BatsmanComp->SetBatRestitutionCoefficient(0.18f); // Soft hands mechanics

    // Transition back to Crease Stance once ball is dead
    Context.ScheduleStateTreeTransition(0.65f, TAG_State_Batting_CreaseStance);
    return EStateTreeRunStatus::Running;
}`
      }
    };

    // Aliases for compatibility
    this.states.idle = this.states.stance;
    this.states.dodge = this.states.stroke;
    this.states.ability = this.states.defense;

    this.init();
  }

  init() {
    this.buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const stateKey = btn.dataset.state;
        this.selectState(stateKey);
        if (window.soundFX) window.soundFX.playLaserChime();
      });
    });

    // Node click handlers
    this.nodes.forEach(node => {
      node.addEventListener('click', () => {
        const id = node.id;
        if (id === 'node-idle' || id === 'node-locomotion') this.selectState('stance');
        else if (id === 'node-sprint') this.selectState('sprint');
        else if (id === 'node-dodge' || id === 'node-abilities') this.selectState('stroke');
        else if (id === 'node-abilitycast') this.selectState('defense');
        if (window.soundFX) window.soundFX.playLaserChime();
      });
    });
  }

  selectState(stateKey) {
    const config = this.states[stateKey];
    if (!config) return;

    // Normalize key
    const primaryKey = (stateKey === 'idle') ? 'stance' : (stateKey === 'dodge') ? 'stroke' : (stateKey === 'ability') ? 'defense' : stateKey;

    // Update buttons
    this.buttons.forEach(btn => {
      const bState = btn.dataset.state;
      btn.classList.toggle('active', bState === primaryKey || bState === stateKey);
    });

    // Update nodes
    this.nodes.forEach(node => {
      node.classList.toggle('active-node', config.activeNodes.includes(node.id));
    });

    // Update cables
    this.cables.forEach(cable => {
      cable.classList.toggle('active', config.activeCables.includes(cable.id));
    });

    // Update code snippet with syntax styling
    if (this.snippetBox) {
      this.snippetBox.innerHTML = this.highlightCode(config.code);
    }
  }

  highlightCode(code) {
    return code
      .replace(/(\/\/.*)/g, '<span class="code-comment">$1</span>')
      .replace(/\b(EStateTreeRunStatus|FStateTreeExecutionContext|UECricketBatsmanComponent|UECricketMovementComponent|FGameplayTagContainer|FVector|TAG_State_StrokeExecution|TAG_State_Batting_CreaseStance|TAG_Locomotion_SprintBetweenWickets|TAG_State_DefensiveBlock)\b/g, '<span class="code-type">$1</span>')
      .replace(/\b(if|return|bool|void|float|const)\b/g, '<span class="code-keyword">$1</span>')
      .replace(/(\b\d+(\.\d+)?f?\b)/g, '<span class="code-number">$1</span>');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new StateTreeVisualizer();
});
