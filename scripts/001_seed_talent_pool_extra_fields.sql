-- =========================================================================
-- A&L Talent — Seed de Configuração de Extra Fields para o Banco de Talentos
-- data_item_type = 100 (Candidate)
-- Tipos OpenCATS: 1=Text, 2=Textarea, 3=Checkbox, 4=Date, 5=Dropdown, 6=Radio
-- =========================================================================

DELETE FROM extra_field_settings WHERE data_item_type = 100;

INSERT INTO extra_field_settings (field_name, date_created, data_item_type, extra_field_type, extra_field_options, position)
VALUES 
('Area de Interesse', NOW(), 100, 5, 'Administrativo,Engenharia,Operacional,Segurança+do+Trabalho,Recursos+Humanos,Financeiro,Suprimentos,Planejamento,Meio+Ambiente,Outra', 1),
('Cargo Desejado', NOW(), 100, 1, NULL, 2),
('Disponibilidade para Viagens', NOW(), 100, 5, 'Total+(Qualquer+região),Parcial+(Viagens+curtas),Apenas+na+região+atual,Não+disponível', 3),
('CNH', NOW(), 100, 5, 'Não+possui,Categoria+A+(Moto),Categoria+B+(Carro),Categoria+AB+(Carro+e+Moto),Categoria+C+(Caminhão),Categoria+D+(Ônibus/Vans),Categoria+E+(Carretas/Pesados)', 4),
('Escolaridade', NOW(), 100, 5, 'Ensino+Médio+Completo,Técnico+em+Andamento,Técnico+Completo,Superior+em+Andamento,Superior+Completo,Pós-Graduação+/+MBA,Mestrado+/+Doutorado', 5),
('Curso', NOW(), 100, 1, NULL, 6),
('Instituicao de Ensino', NOW(), 100, 1, NULL, 7),
('Ano de Conclusao', NOW(), 100, 1, NULL, 8),
('Tempo de Experiencia', NOW(), 100, 5, 'Sem+experiência+(Primeiro+emprego),Menos+de+1+ano,1+a+3+anos,3+a+5+anos,5+a+10+anos,Mais+de+10+anos', 9),
('Ultimo Cargo', NOW(), 100, 1, NULL, 10),
('Consentimento LGPD', NOW(), 100, 1, NULL, 11);
