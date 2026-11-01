/**
 * Unreal Engine 5 StateTree & Gameplay Tag Interactive Visualizer
 * Simulates runtime state transitions, tag evaluation, and displays low-level C++ delegates.
 */
class StateTreeVisualizer {
  constructor() {
    this.buttons = document.querySelectorAll('.node-state-btn');
    this.nodes = document.querySelectorAll('.graph-node-group');
    this.cables = document.querySelectorAll('.cable');
    this.snippetBox = document.getElementById('snippet-code-box');

    this.states = {
      idle: {
        activeNodes: ['node-root', 'node-locomotion', 'node-idle'],
        activeCables: ['cable-root-loco', 'cable-loco-idle'],
        code: `// StateTree Task: Evaluates Idle State Transitions (TDD/ECRICKET-7884)
EStateTreeRunStatus FECricketLocomotionTask::EnterState(FStateTreeExecutionContext& Context)
{
    UECricketCharacterMovementComponent* MoveComp = Context.GetExternalData(MoveCompHandle);
    if (!MoveComp) return EStateTreeRunStatus::Failed;

    // Reset Locomotion tags to Idle state
    MoveComp->RemoveGameplayTag(TAG_Locomotion_Sprint);
    MoveComp->AddGameplayTag(TAG_Locomotion_Idle);

    // Bind idle animation blend weights with zero allocation
    MoveComp->SetMaxWalkSpeed(0.0f);
    return EStateTreeRunStatus::Running;
}`
      },
      sprint: {
        activeNodes: ['node-root', 'node-locomotion', 'node-sprint'],
        activeCables: ['cable-root-loco', 'cable-loco-sprint'],
        code: `// StateTree Task: Sprint Activation & Server Prediction Verification
EStateTreeRunStatus FECricketSprintTask::EnterState(FStateTreeExecutionContext& Context)
{
    UECricketCharacterMovementComponent* MoveComp = Context.GetExternalData(MoveCompHandle);
    if (!MoveComp || !MoveComp->HasValidStamina(10.0f)) 
        return EStateTreeRunStatus::Failed;

    // Transition Gameplay Tags
    MoveComp->AddGameplayTag(TAG_Locomotion_Sprint);
    MoveComp->SetMaxWalkSpeed(750.0f);

    // Dispatch Server-Authoritative Prediction Payload
    MoveComp->Server_SendPredictionPayload(MoveComp->GetLastTimestamp(), TAG_Locomotion_Sprint);
    return EStateTreeRunStatus::Running;
}`
      },
      dodge: {
        activeNodes: ['node-root', 'node-abilities', 'node-dodge'],
        activeCables: ['cable-root-abilities', 'cable-abilities-dodge', 'cable-rep-sync'],
        code: `// StateTree Task: Invulnerability Frames & Root Motion Dodge
EStateTreeRunStatus FECricketDodgeTask::EnterState(FStateTreeExecutionContext& Context)
{
    UECricketCharacterMovementComponent* MoveComp = Context.GetExternalData(MoveCompHandle);
    if (!MoveComp) return EStateTreeRunStatus::Failed;

    // Grant temporary Invulnerability Gameplay Tag
    MoveComp->AddGameplayTag(TAG_State_Invulnerable);
    MoveComp->PlayRootMotionMontage(DodgeMontage);

    // Schedule automatic state rollback delegate after 0.35s
    Context.ScheduleStateTreeTransition(0.35f, TAG_Locomotion_Idle);
    return EStateTreeRunStatus::Running;
}`
      },
      ability: {
        activeNodes: ['node-root', 'node-abilities', 'node-abilitycast'],
        activeCables: ['cable-root-abilities', 'cable-abilities-cast', 'cable-rep-sync'],
        code: `// StateTree Task: Cast Ability RPC & Network Replication Sync
EStateTreeRunStatus FECricketAbilityCastTask::EnterState(FStateTreeExecutionContext& Context)
{
    UECricketCombatComponent* CombatComp = Context.GetExternalData(CombatCompHandle);
    if (!CombatComp) return EStateTreeRunStatus::Failed;

    // Validate ability cooldown & stamina
    if (!CombatComp->CanExecuteAbility(TAG_Ability_CastPrimary))
        return EStateTreeRunStatus::Failed;

    // Fire Replicated Multicast for Audio/VFX synchronization
    CombatComp->Server_ExecuteAbilityRPC(TAG_Ability_CastPrimary);
    return EStateTreeRunStatus::Running;
}`
      }
    };

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
        if (id === 'node-idle' || id === 'node-locomotion') this.selectState('idle');
        else if (id === 'node-sprint') this.selectState('sprint');
        else if (id === 'node-dodge') this.selectState('dodge');
        else if (id === 'node-abilitycast' || id === 'node-abilities') this.selectState('ability');
        if (window.soundFX) window.soundFX.playLaserChime();
      });
    });
  }

  selectState(stateKey) {
    const config = this.states[stateKey];
    if (!config) return;

    // Update buttons
    this.buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.state === stateKey);
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
      .replace(/\b(EStateTreeRunStatus|FStateTreeExecutionContext|UECricketCharacterMovementComponent|FGameplayTagContainer|UECricketCombatComponent)\b/g, '<span class="code-type">$1</span>')
      .replace(/\b(if|return|bool|void|float)\b/g, '<span class="code-keyword">$1</span>')
      .replace(/(\b\d+(\.\d+)?f?\b)/g, '<span class="code-number">$1</span>');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new StateTreeVisualizer();
});
