# Digitalyz Assignment - Rule Builder

A comprehensive business rule management system with AI-powered features for creating, validating, and managing complex business rules.

## 🚀 Features

### Milestone 1 - Core Rule Builder ✅
- **Rule Types Support**: All 6 business rule types implemented
  - Co-run rules (task dependencies)
  - Slot-restriction rules (group constraints)
  - Load-limit rules (worker capacity)
  - Phase-window rules (temporal constraints)
  - Pattern-match rules (regex-based matching)
  - Precedence override rules (priority management)
- **Dynamic Form Interface**: Context-aware forms for each rule type
- **Rule Validation**: Comprehensive validation for all rule types
- **CRUD Operations**: Create, read, update, delete rules
- **Import/Export**: JSON-based rule configuration import/export
- **Persistent State**: Rules persist across browser sessions using Zustand

### Milestone 2 - AI-Powered Features ✅
- **🤖 Natural Language Rule Parser**: Convert plain English descriptions to structured rules
  - Intelligent parsing of natural language input
  - Context-aware rule generation
  - Example suggestions for common rule patterns
  - Real-time validation and error handling

- **🧠 AI Rule Recommendations**: Smart suggestions based on data analysis
  - Pattern recognition in task, worker, and client data
  - Confidence scoring for recommendations
  - One-click rule acceptance
  - Contextual reasoning for each suggestion

- **🔧 AI Service Integration**: Centralized AI processing service
  - Mock AI service with realistic delays
  - Extensible architecture for real AI integration
  - Error handling and fallback mechanisms

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 with TypeScript
- **State Management**: Zustand with persistence
- **Styling**: Inline styles with responsive design
- **AI Integration**: Custom AI service layer (ready for Gemini API integration)
- **Validation**: Comprehensive rule validation system

## 📦 Installation

```bash
npm install
npm run dev
```

## 🎯 Usage

### Manual Rule Creation
1. Select a rule type from the dropdown
2. Fill in the required fields in the dynamic form
3. Click "Add Rule" to save the rule
4. Rules are automatically validated and added to the list

### AI Natural Language Parsing
1. Go to the "AI Natural Language Rule Parser" section
2. Describe your rule in plain English (e.g., "Tasks T1 and T2 must run together")
3. Click "Generate Rule" to convert to structured format
4. Review and accept the generated rule

### AI Rule Recommendations
1. Click "Analyze Data for Recommendations" in the AI section
2. Review suggested rules based on data patterns
3. Accept or dismiss recommendations as needed
4. Request additional suggestions if needed

### Import/Export
- **Import**: Click "Import Rules" to load rules from a JSON file
- **Export**: Click "Generate Rules Config" to download current rules as JSON
- **Clear All**: Remove all rules with confirmation

## 📋 Rule Types

### Co-run Rules
```json
{
  "type": "coRun",
  "tasks": ["T1", "T2", "T3"]
}
```

### Slot-restriction Rules
```json
{
  "type": "slotRestriction",
  "group": "Premium",
  "minCommonSlots": 2
}
```

### Load-limit Rules
```json
{
  "type": "loadLimit",
  "group": "Sales",
  "maxSlotsPerPhase": 3
}
```

### Phase-window Rules
```json
{
  "type": "phaseWindow",
  "task": "T5",
  "allowedPhases": [1, 2, 3]
}
```

### Pattern-match Rules
```json
{
  "type": "patternMatch",
  "regex": ".*urgent.*",
  "template": "templateA",
  "params": {"priority": "high"}
}
```

### Precedence Override Rules
```json
{
  "type": "precedenceOverride",
  "global": ["coRun", "loadLimit"],
  "specific": ["phaseWindow"],
  "priority": 1
}
```

## 🔧 Development

### Project Structure
```
src/
├── app/
│   ├── components/
│   │   └── RuleBuilder/
│   │       ├── RuleBuilder.tsx          # Main component
│   │       ├── NaturalLanguageParser.tsx # AI NLP component
│   │       └── RuleRecommendations.tsx  # AI recommendations
│   └── page.tsx
├── store/
│   └── useRulesStore.ts                 # Zustand store
└── utils/
    ├── ruleAI.ts                        # AI service layer
    └── validation.ts                    # Validation utilities
```

### Adding New Rule Types
1. Update the `Rule` type in `useRulesStore.ts`
2. Add validation logic in `validation.ts`
3. Update the form component in `RuleBuilder.tsx`
4. Add parsing logic in `ruleAI.ts` if needed

### AI Integration
The AI service layer (`ruleAI.ts`) is designed to be easily replaceable with real AI APIs:
- Replace mock delays with actual API calls
- Add authentication and error handling
- Extend parsing logic for more complex scenarios

## 🎉 Milestone Status

- ✅ **Milestone 1**: Core Rule Builder - Complete
- ✅ **Milestone 2**: AI-Powered Features - Complete
- 🔄 **Milestone 3**: Advanced Features - Ready for implementation

## 📝 License

This project is part of the Digitalyz assignment and is for demonstration purposes.
