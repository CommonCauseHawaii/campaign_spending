require 'csv'
new_data = []
id = 1
CSV.open('header.csv', 'w',
         :write_headers => true,
         :headers => %w(candidate_name expenditure_category election_period office amount id)) do |output_csv|
           CSV.foreach("_jekyll/data/campaign_spending_summary.csv", :headers => true) do |row|
             puts "on row #{row}"
             row['id'] = id
             output_csv << row
             # use row here...
             id += 1
           end
         end
#CSV.foreach("_jekyll/data/campaign_spending_summary.csv.short") do |row|
#  puts "on row #{row}"
#  row['id'] = id if id != 0
#  new_data.push(row)
#  # use row here...
#  id += 1
#end

#puts "new_data #{new_data}"
