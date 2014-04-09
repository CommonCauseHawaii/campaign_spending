require 'csv'
new_data = []
id = 1
CSV.open('expenditures_parsed.csv', 'w',
         :write_headers => true,
         :headers => %w(expenditure_category election_period amount reg_no id)) do |output_csv|
           CSV.foreach("expenditures.csv", :headers => true) do |row|
             puts "on row #{row.inspect}"
             entry = {
               expenditure_category: row['Expenditure Category'],
               election_period: row['Election Period'],
               amount: row['Amount'][1..-1],
               reg_no: row['Reg No'],
               id: id,
             }
             output_csv << entry.values
             id += 1
           end
         end

CSV.open('organizational_reports_parsed.csv', 'w',
         :write_headers => true,
         :headers => %w(reg_no candidate_name office district county party)) do |output_csv|
           CSV.foreach("organizational_reports.csv", :headers => true) do |row|
             puts "on row #{row.inspect}"
             entry = {
               reg_no: row['Reg No'],
               candidate_name: row['Candidate Name'],
               office: row['Office'],
               district: row['District'],
               county: row['County'],
               party: row['Party']
             }
             output_csv << entry.values
           end
         end
