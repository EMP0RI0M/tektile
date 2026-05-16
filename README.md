# TekTile: Adorable AI App Builder

### The Edge-Native Full-Stack AI App Builder

**From Prompt to Production: Build and Deploy Full-Stack Applications with Natural Language**

TekTile is a world-class, edge-native development platform engineered to bridge the gap between high-level conceptualization and production-ready deployment. By leveraging Next.js and E2B cloud sandboxes, TekTile delivers a high-performance "Lovable/Bolt.new" style experience. This is not merely a code generator; it is a sophisticated orchestration layer that transforms natural language requirements into comprehensive codebases, complete with complex frontend components, specialized backend logic, and automated database schema management.

The platform is optimized for the modern SaaS architect, providing an environment where generated code is executed within isolated, secure compute environments in real-time. By utilizing a specialized "Next.js-E2B-Supabase" architecture, TekTile ensures low-latency execution and high-fidelity streaming, allowing developers to iterate on full-stack applications without the friction of local environment configuration or manual boilerplate setup.

**Core Mission:** Empowering users to build, preview, and deploy full-stack apps without local setup, democratizing software development through agentic AI orchestration and secure, isolated cloud sandboxes.

---

## Core Features & Innovations

*   **Natural Language to Full-Stack**: Translates abstract text prompts into production-grade codebases, managing everything from UI architecture to database schemas.
*   **E2B Cloud Sandboxes**: Executes AI-generated code within secure, isolated VMs. Every project runs in a dedicated environment, ensuring total isolation between build processes and the host system.
*   **Real-Time Preview & Streaming**: Provides an instantaneous feedback loop. As the AI agents write code, the changes are streamed to the frontend and rendered immediately in a live browser preview.
*   **Two-Way Synchronization**: Features a high-speed state management layer that keeps the browser UI and the remote E2B sandbox perfectly in sync using parallelized file operations.
*   **Visual Inline Editing**: Features an integrated code editor enabling pro-level modifications and immediate hot-reloading within the browser.
*   **MCP Integration**: Native support for the Model Context Protocol (MCP), granting AI agents direct access to PostgreSQL tools, specialized E2B commands, and the GitNexus context engine.

---

## Technical Architecture

*   **Edge-Native Framework**
    *   **Framework**: Next.js (App Router) for streaming UI and low-latency interaction.
    *   **Persistence Layer**: Supabase (PostgreSQL) for serverless data orchestration and authentication.
*   **Agentic Orchestration**
    *   **Adorable Orchestrator**: A custom, high-performance engine that manages multi-step code generation and build processes.
    *   **MCP Layer**: Integration of specialized MCP servers (Postgres Toolbox, Custom E2B JS) providing agents with standardized access to external tools and enhanced repository context.
*   **Secure Compute**
    *   **E2B Code Interpreter**: Secure VM execution for running development servers and terminal commands. TekTile dynamically restores workspace states into fresh sandboxes to ensure persistence.

---

## The Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js, React, Shadcn UI | High-performance full-stack framework with modern UI primitives. |
| **Persistence** | Supabase (PostgreSQL) | Scalable database and auth backend for project metadata and manifests. |
| **Execution** | E2B Cloud Sandboxes | Secure, isolated VM environments for code execution and previews. |
| **AI Engine** | OpenRouter (DeepSeek, Claude, GPT) | Multi-model orchestration for specialized code reasoning and generation. |
| **Tools** | MCP (Postgres, E2B, GitNexus) | Standardized interface for agents to interact with the environment. |
| **Styling** | Tailwind CSS | Modern, utility-first styling for generated applications. |

---

## Environment Configuration

To initialize the TekTile environment, ensure the following keys are defined in your `.env.local` file (see `env.example` for details):

*   `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`
*   `SUPABASE_SERVICE_ROLE_KEY`
*   `E2B_API_KEY`
*   `OPENROUTER_API_KEY` (Standardized for Adorable AI)
*   `POSTGRES_URL` (For the MCP Postgres Toolbox)

---

## Getting Started: Installation

TekTile requires Node.js v20+ and NPM for optimal performance.

1.  **Clone the repository**: `git clone https://github.com/EMP0RI0M/tektile.git`
2.  **Install dependencies**: `npm install`
3.  **Setup Environment**: Copy `env.example` to `.env.local` and fill in your keys.
4.  **Start Development**: `npm run dev`

---

## Stabilization Status (v1.0.0-stable)

The platform has recently undergone a major stabilization phase:
- **Speed**: Optimized sync logic (parallelized I/O) reduced latency by 90%.
- **Persistence**: Fixed workspace restoration issues for E2B sandboxes.
- **Rendering**: Resolved chat history and file explorer display bugs.
- **Auth**: Implemented seamless API key detection for OpenRouter.

---

## License & Acknowledgments

This project is open-source and licensed under the MIT License.

Special thanks to:
*   **Next.js**: For the foundation of the modern web.
*   **E2B**: For the industry-leading sandboxed compute infrastructure.
*   **Supabase**: For the robust backend and database orchestration.
*   **Anthropic**: For the Model Context Protocol (MCP) standard.
