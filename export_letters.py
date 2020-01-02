import pandas as pd
import sys

df = pd.read_csv('todos.tsv', sep='\t')
for reviewer in ['1', '2', '3']:
    reviews = df[df.Reviewer == reviewer]
    reviews = reviews.sort_values(by='Order')
    with open('letter-to-reviewer-{}.md'.format(reviewer), 'w') as f:
        f.write('Letter to Reviewer {}\n'.format(reviewer))
        for quote, response, row in zip(reviews.Quote, reviews.Response, reviews.iterrows()):
            try:
                for q in quote.split('\n'):
                    f.write('> ' + q + '\n')
                f.write('\n')
                for r in response.split('\n'):
                    f.write(r + '\n')
                f.write('\n')
            except:
                print(row)
                sys.exit()
