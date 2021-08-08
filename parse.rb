require 'csv'
id = 1
CSV.open('_jekyll/data/campaign_spending_summary.csv', 'w',
         :write_headers => true,
         :headers => %w(expenditure_category election_period amount reg_no id)) do |output_csv|
           CSV.foreach("raw_data/expenditures.csv", :headers => true) do |row|
             #puts "on row #{row.inspect}"
             entry = {
               expenditure_category: row['Expenditure Category'].strip,
               election_period: row['Election Period'].strip,
               amount: row['Amount'].strip,
               reg_no: row['Reg No'].strip,
               id: id,
             }
             output_csv << entry.values
             id += 1
           end
         end

CSV.open('_jekyll/data/organizational_report.csv', 'w',
         :write_headers => true,
         :headers => %w(reg_no candidate_name office district county party)) do |output_csv|
           CSV.foreach("raw_data/organizational_reports.csv", :headers => true) do |row|
             # Skip Ronald, Strode since his data is bad
             next if row['reg_no'] == 'CC11033'
             if row['party'].nil?
               puts "Skipping candidate with Reg No #{row['reg_no']} and name #{row['candidate_name']} because missing party"
               next
             end
             entry = {
               reg_no: row['reg_no'].strip,
               candidate_name: row['candidate_name'].strip,
               office: row['office'].strip,
               district: row['district'] && row['district'].strip,
               county: row['county'] && row['county'].strip,
               party: row['party'].strip
             }
             output_csv << entry.values
           end
         end
