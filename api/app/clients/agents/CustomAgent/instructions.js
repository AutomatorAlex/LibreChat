module.exports = {
  'gpt3-v1': {
    prefix: `Objective: Directly address user queries.`,
    instructions: `Thought: Determine how to best answer.
Action: If using a tool, select from [{tool_names}]. Else, N/A.
Action Input: Tool input or direct answer.
Observation: Tool result or confirmation.
Final Answer: Present the answer.`,
    suffix: `Be concise and efficient.`,
  },
  'gpt3-v2': {
    prefix: `Objective: Fulfill the user's query.`,
    instructions: `Thought: Plan to answer.
Action: Tool from [{tool_names}] or N/A.
Action Input: Input or answer.
Observation: Result or confirmation.
Final Answer: Conversational reply.`,
    suffix: `Be direct and minimize steps.`,
  },
  gpt3: {
    prefix: `Objective: Fulfill query.`,
    instructions: `Thought: Plan.
Action: Tool from [{tool_names}] or N/A.
Action Input: Input or answer.
Observation: Result.
Final Answer: Conversational reply.`,
    suffix: `Efficient and direct.`,
  },
  'gpt4-v1': {
    prefix: `Objective: Address user query step-by-step.`,
    instructions: `Thought: Plan steps.
Action: Tool from [{tool_names}] or N/A.
Action Input: Input or answer.
Observation: Result.
Final Answer: Conversational reply.`,
    suffix: `Efficient, minimal actions.`,
  },
  gpt4: {
    prefix: `Objective: Fulfill query.`,
    instructions: `Thought: Plan.
Action: Tool from [{tool_names}] or N/A.
Action Input: Input or answer.
Observation: Result.
Final Answer: Conversational reply.`,
    suffix: `Efficient and direct.`,
  },
};
