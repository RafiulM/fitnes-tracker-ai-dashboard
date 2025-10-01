# App Flowchart

flowchart TD
  A[Homepage] --> B[Login Sign Up]
  B --> C[Chat Interface]
  C --> D[Process Chat Input]
  D --> E[Database]
  E --> C
  C --> F[Dashboard]
  F --> G[Insights Visualization]
  F --> H[Request New Plan]
  H --> I[AI SDK Plan Generation]
  I --> E
  I --> C
  F --> J[Profile Settings]
  J --> E
  J --> C

---
**Document Details**
- **Project ID**: 2d581913-6f01-4d83-a87d-eb24341aaf30
- **Document ID**: b86095e6-1f96-423d-b1d0-487265852ae1
- **Type**: custom
- **Custom Type**: app_flowchart
- **Status**: completed
- **Generated On**: 2025-10-01T11:38:28.129Z
- **Last Updated**: N/A
