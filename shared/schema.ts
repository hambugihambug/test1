import { mysqlTable, text, serial, int, boolean, double, timestamp } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Role enum for user types
export const UserRole = {
    DIRECTOR: "director", // Hospital director (총관리자/병원장)
    NURSE: "nurse", // Nurse (관리자/간호사)
    PATIENT: "patient", // Patient (환자)
    GUARDIAN: "guardian", // Guardian (보호자)
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// User table
export const users = mysqlTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    name: text("name").notNull(),
    role: text("role").$type<UserRole>().notNull(),
    fcmToken: text("fcm_token"),
    preferredLanguage: text("preferred_language").default("ko"),
    createdAt: timestamp("created_at").defaultNow(),
});

// Room table
export const rooms = mysqlTable("rooms", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    tempThreshold: double("temp_threshold").default(26.0),
    humidityThreshold: double("humidity_threshold").default(60.0),
    layout: text("layout"),
    currentTemp: double("current_temp"),
    currentHumidity: double("current_humidity"),
    status: text("status").default("normal"),
});

// Patient table
export const patients = mysqlTable("patients", {
    id: serial("id").primaryKey(),
    userId: int("user_id").references(() => users.id),
    name: text("name").notNull(),
    age: int("age").notNull(),
    height: double("height"),
    weight: double("weight"),
    blood: text("blood"),
    roomId: int("room_id").references(() => rooms.id),
    bedNumber: int("bed_number"),
    fallRisk: text("fall_risk").default("low"),
    assignedNurseId: int("assigned_nurse_id").references(() => users.id),
});

// Guardian table
export const guardians = mysqlTable("guardians", {
    id: serial("id").primaryKey(),
    userId: int("user_id").references(() => users.id),
    patientId: int("patient_id").references(() => patients.id),
    name: text("name").notNull(),
    tel: text("tel").notNull(),
});

// Accident table for fall records
export const accidents = mysqlTable("accidents", {
    id: serial("id").primaryKey(),
    patientId: int("patient_id").references(() => patients.id),
    roomId: int("room_id").references(() => rooms.id),
    date: timestamp("date").defaultNow(),
    notified: boolean("notified").default(false),
    resolved: boolean("resolved").default(false),
    resolvedBy: int("resolved_by").references(() => users.id),
});

// Environment logs
export const envLogs = mysqlTable("env_logs", {
    id: serial("id").primaryKey(),
    roomId: int("room_id").references(() => rooms.id),
    temperature: double("temperature"),
    humidity: double("humidity"),
    timestamp: timestamp("timestamp").defaultNow(),
    alert: boolean("alert").default(false),
});

// CCTV cameras
export const cameras = mysqlTable("cameras", {
    id: serial("id").primaryKey(),
    roomId: int("room_id").references(() => rooms.id),
    name: text("name").notNull(),
    streamUrl: text("stream_url"),
    active: boolean("active").default(true),
});

// Messages between guardians and nurses
export const messages = mysqlTable("messages", {
    id: serial("id").primaryKey(),
    senderId: int("sender_id").references(() => users.id),
    receiverId: int("receiver_id").references(() => users.id),
    message: text("message").notNull(),
    timestamp: timestamp("timestamp").defaultNow(),
    read: boolean("read").default(false),
});

// Insert schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users).omit({
    id: true,
    fcmToken: true,
    createdAt: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
    id: true,
    currentTemp: true,
    currentHumidity: true,
    status: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
    id: true,
});

export const insertGuardianSchema = createInsertSchema(guardians).omit({
    id: true,
});

export const insertAccidentSchema = createInsertSchema(accidents).omit({
    id: true,
    date: true,
    notified: true,
    resolved: true,
    resolvedBy: true,
});

export const insertEnvLogSchema = createInsertSchema(envLogs).omit({
    id: true,
    timestamp: true,
    alert: true,
});

export const insertCameraSchema = createInsertSchema(cameras).omit({
    id: true,
    active: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
    id: true,
    timestamp: true,
    read: true,
});

// Type definitions for the inserts
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type InsertGuardian = z.infer<typeof insertGuardianSchema>;
export type InsertAccident = z.infer<typeof insertAccidentSchema>;
export type InsertEnvLog = z.infer<typeof insertEnvLogSchema>;
export type InsertCamera = z.infer<typeof insertCameraSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Type definitions for the selects
export type User = typeof users.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type Patient = typeof patients.$inferSelect;
export type Guardian = typeof guardians.$inferSelect;
export type Accident = typeof accidents.$inferSelect;
export type EnvLog = typeof envLogs.$inferSelect;
export type Camera = typeof cameras.$inferSelect;
export type Message = typeof messages.$inferSelect;

// Extended type for room with patients
export type RoomWithPatients = Room & {
    patients: Patient[];
};

// Extended type for patient with details
export type PatientWithDetails = Patient & {
    user: User;
    room: Room;
    guardian?: Guardian;
    assignedNurse?: User;
};
