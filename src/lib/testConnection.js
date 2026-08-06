// src/lib/testConnection.js

import { supabase } from "./supabase";

export async function testConnection() {
  console.log("==================================");
  console.log("Vox Orantis - Teste de Conexão");
  console.log("==================================");

  const { data, error } = await supabase
    .from("stats")
    .select("*")
    .limit(1);

  if (error) {
    console.error("❌ Erro ao conectar:");
    console.error(error);
    return false;
  }

  console.log("✅ Conexão realizada com sucesso!");
  console.log(data);

  return true;
}