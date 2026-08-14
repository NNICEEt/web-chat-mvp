# Web Chat

## MVP Scope

สิ่งที่รวมอยู่ใน MVP:

- รับ LINE webhook และ verify signature
- รองรับข้อความประเภท text
- ป้องกันการ process webhook event ซ้ำ
- persist ข้อมูล User, Conversation และ Message
- sync ชื่อและรูป profile จาก LINE
- แสดง conversation list และ message history
- ส่งข้อความตอบกลับผ่าน LINE Messaging API
- บันทึก outbound message status
- sync ข้อมูลบน browser ด้วย short polling
- ใช้ PostgreSQL บน Neon และ deploy application บน Vercel

สิ่งที่ยังไม่อยู่ในขอบเขต ได้แก่ authentication, การมอบหมายหลายเจ้าหน้าที่, ข้อความประเภท media, read receipt, typing indicator, search, queue, retry worker และ WebSocket/SSE

## Tech Stack

| ส่วนงาน | เทคโนโลยี |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, Tailwind CSS 4 |
| Backend | Next.js Route Handlers |
| Language | TypeScript |
| ORM | Prisma 7 |
| Database | PostgreSQL บน Neon |
| PostgreSQL driver | `pg` ผ่าน `@prisma/adapter-pg` |
| Messaging provider | LINE Messaging API |
| Browser synchronization | Short polling ทุก 5 วินาที |
| Unit testing | Vitest |
| Deployment | Vercel |

## Architecture

```mermaid
flowchart LR
    Customer[LINE Customer]
    LINE[LINE Platform]
    Webhook[Webhook Route]
    API[Conversation APIs]
    UI[Agent Web Inbox]
    UseCases[Use Cases]
    LineClient[LINE Client]
    Repositories[Repositories]
    DB[(Neon PostgreSQL)]

    Customer <--> LINE
    LINE -->|Webhook| Webhook
    Webhook --> UseCases
    UI <--> API
    API --> UseCases
    UseCases --> Repositories
    Repositories --> DB
    UseCases --> LineClient
    LineClient -->|Profile / Push message| LINE
```

Database เป็นแหล่งข้อมูลหลักของระบบ:

```text
LINE webhook -> backend -> database -> API polling -> agent UI
```

### Responsibilities

| ส่วน | Responsibility |
| --- | --- |
| `src/app` | UI และ HTTP transport |
| `src/use-cases` | Application workflows และ business decisions |
| `src/integrations/line` | Integration และ data mapping ระหว่างระบบกับ LINE |
| `src/repositories` | อ่านและ persist ข้อมูล |
| `src/db` | Prisma configuration และ PostgreSQL connection |
| `src/models` | Internal models ที่ไม่ผูกกับ LINE โดยตรง |

ทิศทาง dependency หลัก:

```text
Route Handler -> Use Case -> Repository -> Prisma -> PostgreSQL
                         \-> LINE Client -> LINE Platform
```

## Core Workflows

### Inbound Message

```text
LINE webhook
  -> verify signature
  -> map เป็น internal event
  -> deduplicate event
  -> persist User, Conversation และ Message
  -> response webhook
  -> sync LINE profile แบบ background
  -> UI sync ข้อมูลผ่าน polling
```

### Outbound Message

```text
Agent ส่งข้อความ
  -> persist ข้อความเป็น PENDING
  -> ส่งผ่าน LINE Messaging API
  -> update เป็น SENT หรือ FAILED
```

การเรียก LINE API จะอยู่นอก database transaction เพื่อไม่ให้เปิด transaction ค้างระหว่างรอ external service โดย profile sync จะทำหลัง response webhook และ failure จะไม่กระทบ inbound message ที่ persist สำเร็จแล้ว

## Domain Model

```mermaid
erDiagram
    USER ||--o{ CONVERSATION : has
    CONVERSATION ||--o{ MESSAGE : contains

    USER {
      string id PK
      string lineUserId UK
      string displayName
      string pictureUrl
    }

    CONVERSATION {
      string id PK
      string userId FK
      string status
      datetime lastMessageAt
    }

    MESSAGE {
      string id PK
      string conversationId FK
      string direction
      string type
      string text
      string providerMessageId UK
      string webhookEventId UK
      string status
      datetime occurredAt
    }
```

Domain invariants ที่สำคัญ:

- ผู้ใช้หนึ่งคนมีประวัติหลายบทสนทนาได้ แต่มีบทสนทนาที่ `ACTIVE` ได้ครั้งละหนึ่งรายการ
- ข้อความขาเข้าใช้สถานะ `RECEIVED`
- ข้อความขาออกเปลี่ยนจาก `PENDING` เป็น `SENT` หรือ `FAILED`
- `webhookEventId` ใช้ deduplicate event
- `lastMessageAt` ใช้ sort conversation list ตาม activity ล่าสุด
- MVP รองรับเฉพาะข้อความประเภท `TEXT`

## API Surface

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/line/webhook` | รับ LINE webhook |
| `GET` | `/api/conversations` | แสดง conversation list |
| `GET` | `/api/conversations/:conversationId/messages` | แสดง message history |
| `POST` | `/api/conversations/:conversationId/messages` | ส่งข้อความตอบกลับจาก Agent |

## Project Structure

```text
prisma/
├── migrations/
└── schema.prisma

src/
├── app/
│   ├── api/
│   │   ├── line/webhook/route.ts
│   │   └── conversations/
│   │       ├── route.ts
│   │       └── [conversationId]/messages/route.ts
│   └── ui/
│       ├── components/
│       ├── shared/
│       └── utils/
├── db/
│   ├── client.ts
│   └── generated/prisma/
├── integrations/line/
│   └── __tests__/
├── models/
├── repositories/
└── use-cases/
    └── __tests__/
```

## Development Setup

สิ่งที่ต้องมี:

- Node.js 20.19 ขึ้นไป
- PostgreSQL database
- LINE Messaging API channel

ติดตั้ง dependencies:

```bash
npm install
```

คัดลอกไฟล์ environment variables และใส่ credentials:

```bash
cp .env.example .env
```

ตัวแปรที่ระบบต้องใช้:

```dotenv
DATABASE_URL="postgresql://...-pooler..."
DIRECT_URL="postgresql://..."
LINE_CHANNEL_SECRET="..."
LINE_CHANNEL_ACCESS_TOKEN="..."
```

`DATABASE_URL` ใช้ pooled connection สำหรับ application runtime ส่วน `DIRECT_URL` ใช้ direct connection สำหรับ Prisma commands โดย local environment สามารถใช้ `DATABASE_URL` แทนได้หากไม่ได้แยก connection ทั้งสองแบบ

ตัวแปรเหล่านี้ใช้เฉพาะฝั่ง server ห้ามเติม `NEXT_PUBLIC_` และห้ามนำไปใช้ใน browser code

สร้าง Prisma Client:

```bash
npm run prisma:generate
```

สร้าง development migration หลังจาก database change ผ่าน review:

```bash
npm run prisma:migrate -- --name <migration-name>
```

เริ่ม development server:

```bash
npm run dev
```

## Production Deployment

กำหนด Environment Variables ต่อไปนี้ใน Vercel Production:

- `DATABASE_URL` เป็น Neon pooled connection
- `DIRECT_URL` เป็น Neon direct connection
- `LINE_CHANNEL_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`

ตั้ง Vercel Build Command เป็น:

```bash
npm run vercel-build
```

คำสั่งนี้จะ generate Prisma Client, apply pending migrations ด้วย `prisma migrate deploy` และ build Next.js ตามลำดับ หาก migration หรือ build ไม่ผ่าน deployment จะหยุดทันที

Preview Deployment ต้องใช้ Neon branch หรือ database แยก ห้ามกำหนด `DIRECT_URL` ของ production ให้ Preview Environment

หลัง deploy ให้ตั้ง LINE webhook URL เป็น:

```text
https://<vercel-domain>/api/line/webhook
```

## Testing และ Verification

```bash
npm run prisma:validate
npm run typecheck
npm run lint
npm test
npm run build
```

Automated tests ของโปรเจกต์เน้นเฉพาะ:

- LINE signature verifier
- LINE webhook adapter
- Use cases

Repository, Prisma และ live database integration tests ยังไม่อยู่ใน scope โดยจะ verify database behavior ผ่าน migration และ manual/end-to-end testing ที่จำเป็น

## Implementation Status

โปรเจกต์ใช้ review gate โดยทำและ review ทีละ checklist ก่อน commit และเริ่มส่วนถัดไป

- [x] ออกแบบ architecture และ responsibilities
- [x] กำหนด environment contract และ Prisma foundation
- [x] ตั้งค่า Vitest
- [x] LINE signature verifier
- [x] LINE webhook adapter
- [x] Repositories
- [x] Inbound use case และ webhook route
- [x] Conversation และ message read APIs
- [x] Outbound LINE client, use case และ API
- [x] Agent inbox UI และ short polling
- [x] Initial database migration
- [x] Production deployment configuration
- [x] Vercel deployment และ production environment
- [x] LINE end-to-end verification
