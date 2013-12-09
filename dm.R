library(RMySQL)
library(arules)

con <- dbConnect(MySQL(), user="root", dbname="md")

t <- dbGetQuery(con, "SELECT distinct classe as clone, a.id as file, fn.id as method FROM md.fonte f inner join md.arquivo a on f.file = a.file, md.funcao fn where f.startline >= fn.startline and f.endline <= fn.endline and f.file = fn.file")

agg_m <- split(t$clone, t$method)
agg_f <- split(t$clone, t$file)

for (i in 1:length(agg_f)) { 
	prev = -1;
	for (j in 1:length(agg_f[[i]])) { 
		if (prev != agg_f[[i]][j]) {
			index = 1
			prev <- agg_f[[i]][j]
		} else {
			index <- index + 1
		}
		agg_f[[i]][j] <- paste(as.character(agg_f[[i]][j]), index, sep=":")
	}
}


tx_m <- as(agg_m, "transactions")
tx_f <- as(agg_f, "transactions")

itemsets_m <- eclat(tx_m, parameter=list(support=2/length(tx_m),minlen=2,tidLists=TRUE,target="closed frequent itemsets"))

itemsets_f <- eclat(tx_f, parameter=list(support=2/length(tx_f),minlen=2,maxlen=3,tidLists=TRUE,target="closed frequent itemsets"))

#itemsets_f <- apriori(tx_m, parameter=list(support=0.0000000001,minlen=2,target="closed frequent itemsets"))

#m1 <- interestMeasure(itemsets_m, "support", transactions = tx_m, reuse = FALSE)

df_m <- as(itemsets_m, "data.frame")
df_f <- as(itemsets_f, "data.frame")

#inclui a lista de transações correspondentes em cada linha
for (i in 1:nrow(df_m)) {
	df_m[i,"transactions"] <- paste(as(tidLists(itemsets_m), "list")[[as(df_m[i,"items"], "character")]], collapse=" ")
}
tl_f = as(tidLists(itemsets_f), "list")
for (i in 1:1000) {
	df_f[i,"transactions"] <- paste(tl_f[[as(df_f[i,"items"], "character")]], collapse=" ")
}

dbDisconnect(con)