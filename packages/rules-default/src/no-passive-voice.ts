import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'

export interface NoPassiveVoiceOptions {
  /** Auxiliary verbs that can introduce a passive construction. */
  auxiliaries?: string[]
  /** Past participles to flag when preceded by an auxiliary. */
  participles?: string[]
  /** Phrases to allow even if they match the passive pattern. */
  allowedPhrases?: string[]
}

const DEFAULT_AUXILIARIES = ['is', 'are', 'was', 'were', 'be', 'been', 'being']

const DEFAULT_PARTICIPLES = [
  'accepted', 'accomplished', 'achieved', 'acquired', 'added', 'addressed', 'adjusted', 'admired',
  'admitted', 'adopted', 'advanced', 'affected', 'afforded', 'agreed', 'allowed', 'announced',
  'answered', 'anticipated', 'approved', 'arranged', 'asked', 'assembled', 'assessed', 'assigned',
  'assisted', 'assumed', 'assured', 'attached', 'attacked', 'attempted', 'attended', 'attracted',
  'avoided', 'awarded', 'based', 'beaten', 'become', 'begun', 'believed', 'belonged', 'benefited',
  'betrayed', 'blamed', 'blessed', 'blocked', 'blown', 'boarded', 'boiled', 'booked', 'borrowed',
  'bothered', 'bought', 'bound', 'branded', 'broken', 'brought', 'built', 'burned', 'burst',
  'called', 'captured', 'carried', 'caused', 'caught', 'celebrated', 'challenged', 'changed',
  'charged', 'chased', 'checked', 'chosen', 'claimed', 'cleaned', 'cleared', 'clicked', 'climbed',
  'closed', 'coached', 'collected', 'combined', 'come', 'comforted', 'committed', 'communicated',
  'compared', 'competed', 'completed', 'complicated', 'composed', 'computed', 'conceived',
  'concentrated', 'concerned', 'concluded', 'conditioned', 'conducted', 'confirmed', 'connected',
  'considered', 'consisted', 'constructed', 'consulted', 'consumed', 'contacted', 'contained',
  'continued', 'contributed', 'controlled', 'converted', 'convinced', 'cooked', 'cost', 'counted',
  'covered', 'created', 'crossed', 'crowded', 'crushed', 'cried', 'cut', 'damaged', 'danced',
  'dated', 'dealt', 'decided', 'declared', 'declined', 'decorated', 'decreased', 'defeated',
  'defended', 'defined', 'delayed', 'delivered', 'demanded', 'demonstrated', 'denied', 'departed',
  'depended', 'described', 'deserved', 'designed', 'destroyed', 'detailed', 'detected', 'determined',
  'developed', 'devoted', 'differed', 'digested', 'diminished', 'directed', 'discovered', 'discussed',
  'displayed', 'distributed', 'disturbed', 'divided', 'done', 'doubled', 'doubted', 'drafted',
  'dragged', 'drawn', 'dressed', 'driven', 'dropped', 'drowned', 'dug', 'earned', 'eaten',
  'edited', 'educated', 'elected', 'eliminated', 'embarrassed', 'emerged', 'employed', 'enabled',
  'encouraged', 'ended', 'engaged', 'engineered', 'enjoyed', 'entered', 'entertained', 'equipped',
  'escaped', 'established', 'estimated', 'evaluated', 'evolved', 'examined', 'exceeded', 'exchanged',
  'excited', 'excused', 'executed', 'exercised', 'exhausted', 'exhibited', 'expanded', 'expected',
  'experienced', 'explained', 'exploded', 'explored', 'exported', 'exposed', 'expressed', 'extended',
  'faced', 'failed', 'fallen', 'favored', 'feared', 'featured', 'fed', 'felt', 'fetched',
  'fielded', 'filled', 'filmed', 'filtered', 'financed', 'finished', 'fired', 'fitted', 'fixed',
  'flashed', 'flown', 'focused', 'folded', 'followed', 'forced', 'forgotten', 'formed', 'founded',
  'framed', 'freed', 'frozen', 'frustrated', 'fueled', 'fulfilled', 'functioned', 'funded',
  'gained', 'gathered', 'given', 'gone', 'governed', 'grabbed', 'graded', 'granted', 'greeted',
  'grown', 'guaranteed', 'guarded', 'guessed', 'guided', 'handled', 'hanged', 'happened', 'harmed',
  'harvested', 'hated', 'headed', 'healed', 'heard', 'heated', 'helped', 'hidden', 'highlighted',
  'hired', 'hit', 'held', 'honored', 'hooked', 'hoped', 'hosted', 'hunted', 'hurried', 'hurt',
  'identified', 'ignored', 'illustrated', 'imagined', 'implemented', 'implied', 'imported',
  'imposed', 'impressed', 'improved', 'included', 'increased', 'indicated', 'influenced', 'informed',
  'initiated', 'injured', 'inquired', 'inserted', 'inspected', 'inspired', 'installed', 'instructed',
  'intended', 'interacted', 'interested', 'interrupted', 'interviewed', 'introduced', 'invented',
  'invested', 'investigated', 'invited', 'involved', 'isolated', 'issued', 'joined', 'judged',
  'jumped', 'justified', 'kept', 'kicked', 'killed', 'kissed', 'knocked', 'known', 'labeled',
  'lacked', 'landed', 'lasted', 'launched', 'learned', 'leased', 'left', 'lent', 'let', 'licensed',
  'lifted', 'lighted', 'liked', 'limited', 'linked', 'listed', 'listened', 'lived', 'loaded',
  'located', 'locked', 'logged', 'looked', 'lost', 'loved', 'made', 'maintained', 'managed',
  'manufactured', 'marked', 'marketed', 'married', 'mastered', 'matched', 'mattered', 'matured',
  'meant', 'measured', 'met', 'mentioned', 'merged', 'messed', 'migrated', 'minded', 'missed',
  'mixed', 'modified', 'monitored', 'moved', 'multiplied', 'named', 'narrowed', 'needed',
  'negotiated', 'noted', 'noticed', 'obtained', 'occurred', 'offered', 'opened', 'operated',
  'opposed', 'ordered', 'organized', 'oriented', 'originated', 'overcome', 'overlooked', 'owned',
  'paced', 'packed', 'paid', 'painted', 'paired', 'parked', 'participated', 'passed', 'patented',
  'paused', 'perceived', 'performed', 'permitted', 'persuaded', 'phased', 'picked', 'pictured',
  'placed', 'planned', 'planted', 'played', 'pleased', 'plugged', 'pointed', 'polished', 'popped',
  'possessed', 'posted', 'poured', 'powered', 'praised', 'prayed', 'preached', 'preceded',
  'predicted', 'preferred', 'prepared', 'prescribed', 'presented', 'preserved', 'pressed', 'pretended',
  'prevented', 'priced', 'printed', 'prioritized', 'processed', 'produced', 'profited', 'programmed',
  'prohibited', 'promised', 'promoted', 'prompted', 'proposed', 'protected', 'proved', 'provided',
  'published', 'pulled', 'pumped', 'punched', 'purchased', 'pursued', 'pushed', 'put', 'qualified',
  'questioned', 'quit', 'quoted', 'raised', 'ranked', 'rated', 'reached', 'reacted', 'read',
  'realized', 'received', 'recognized', 'recommended', 'reconciled', 'recorded', 'recovered',
  'recruited', 'reduced', 'referred', 'reflected', 'refused', 'regarded', 'regulated', 'rejected',
  'related', 'released', 'remained', 'remembered', 'reminded', 'removed', 'rendered', 'renewed',
  'rented', 'repaired', 'repeated', 'replaced', 'replied', 'reported', 'represented', 'reproduced',
  'requested', 'required', 'researched', 'reserved', 'resolved', 'respected', 'responded', 'restored',
  'resulted', 'retained', 'retired', 'retrieved', 'returned', 'revealed', 'reviewed', 'revised',
  'revived', 'rewarded', 'ridden', 'risen', 'rolled', 'rooted', 'rounded', 'ruled', 'run', 'rushed',
  'sacrificed', 'said', 'sold', 'sampled', 'saved', 'scanned', 'scared', 'scheduled', 'scored',
  'scraped', 'scratched', 'screened', 'searched', 'seasoned', 'seated', 'secured', 'seen', 'selected',
  'sent', 'separated', 'served', 'serviced', 'set', 'settled', 'settled', 'shaped', 'shared',
  'shocked', 'shaken', 'shaped', 'shipped', 'shocked', 'shot', 'shown', 'shut', 'signed', 'simplified',
  'singled', 'sited', 'situated', 'sized', 'sketched', 'skilled', 'slammed', 'slashed', 'slid',
  'slipped', 'slowed', 'smashed', 'smelled', 'smiled', 'smoked', 'snapped', 'soaked', 'sold',
  'solved', 'sorted', 'sought', 'sounded', 'spared', 'sparked', 'spawned', 'spearheaded', 'specified',
  'spent', 'spilled', 'spun', 'split', 'spoken', 'sponsored', 'spotted', 'spread', 'sprung',
  'staged', 'stained', 'staked', 'stalled', 'stamped', 'started', 'stated', 'stationed', 'stayed',
  'stolen', 'stepped', 'sticked', 'stimulated', 'stirred', 'stopped', 'stored', 'strained',
  'streamed', 'strengthened', 'stressed', 'stretched', 'stricken', 'struck', 'structured',
  'struggled', 'studied', 'stuffed', 'styled', 'submitted', 'substituted', 'succeeded', 'sucked',
  'sued', 'suffered', 'suggested', 'suited', 'summed', 'supplied', 'supported', 'supposed',
  'surprised', 'surrounded', 'surveyed', 'survived', 'suspected', 'suspended', 'sustained', 'swallowed',
  'swapped', 'swept', 'swelled', 'swung', 'switched', 'tackled', 'tagged', 'taken', 'talked',
  'tapped', 'targeted', 'tasted', 'taught', 'torn', 'tested', 'testified', 'texted', 'thanked',
  'thrown', 'thrust', 'ticked', 'tied', 'tightened', 'timed', 'tipped', 'tired', 'titled',
  'tolerated', 'topped', 'touched', 'toured', 'tracked', 'traded', 'trained', 'transferred',
  'transformed', 'translated', 'transmitted', 'transported', 'trapped', 'traveled', 'treated',
  'trimmed', 'tripled', 'triumphed', 'troubled', 'trusted', 'tried', 'turned', 'twisted', 'typed',
  'undergone', 'understood', 'undertaken', 'unfolded', 'unified', 'united', 'updated', 'upgraded',
  'upheld', 'upset', 'used', 'utilized', 'valued', 'vanished', 'varied', 'verified', 'vetoed',
  'viewed', 'visited', 'voiced', 'voted', 'waged', 'waited', 'walked', 'wandered', 'wanted',
  'warned', 'warranted', 'washed', 'wasted', 'watched', 'weakened', 'worn', 'welcomed', 'won',
  'wondered', 'worked', 'worried', 'worshiped', 'wounded', 'written', 'wrung', 'yielded',
]

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildPassivePattern(auxiliaries: string[], participles: string[]): RegExp {
  const auxPattern = auxiliaries.map(escapeRegExp).join('|')
  const participlePattern = participles.map(escapeRegExp).join('|')
  return new RegExp(`\\b(${auxPattern})\\s+(\\w+\\s+){0,3}(${participlePattern})\\b`, 'gi')
}

export const noPassiveVoice: Rule<NoPassiveVoiceOptions> = {
  id: 'no-passive-voice',
  description: 'Flag likely passive-voice constructions using auxiliary + past participle patterns',
  defaults: {
    auxiliaries: DEFAULT_AUXILIARIES,
    participles: DEFAULT_PARTICIPLES,
    allowedPhrases: [],
  },
  help: 'Passive voice often hides the actor and adds drag. ' +
    'Prefer naming who did the action unless the actor genuinely does not matter.',

  check({ text, sourceMap, options }: RuleInput<NoPassiveVoiceOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const auxiliaries = options.auxiliaries?.length ? options.auxiliaries : DEFAULT_AUXILIARIES
    const participles = options.participles?.length ? options.participles : DEFAULT_PARTICIPLES
    const allowed = new Set((options.allowedPhrases ?? []).map(phrase => phrase.toLowerCase()))

    const re = buildPassivePattern(auxiliaries, participles)
    let match: RegExpExecArray | null

    while ((match = re.exec(text)) !== null) {
      const matchedText = match[0]
      const lowerMatch = matchedText.toLowerCase()

      let allowedMatch = false
      for (const phrase of allowed) {
        if (lowerMatch.includes(phrase.toLowerCase())) {
          allowedMatch = true
          break
        }
      }
      if (allowedMatch) continue

      const start = sourceMap[match.index]!
      const end = sourceMap[match.index + matchedText.length - 1]! + 1

      diagnostics.push({
        ruleId: 'no-passive-voice',
        severity: 'warn',
        message: `rewrite passive construction "${matchedText}" with a named actor`,
        range: { start, end },
        help: noPassiveVoice.help,
      })
    }

    return diagnostics
  },
}
